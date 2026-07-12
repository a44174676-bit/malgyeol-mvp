import { analyzeDdkPattern, standardDeviation, type DdkPatternAnalysis } from "@/lib/audio/analyze-ddk-pattern";
import { getTargetSyllables, type ClinicalTaskType } from "@/lib/clinical/build-reference-note";

export type AcousticAnalysis = {
  totalDurationSecond: number;
  voicedDurationSecond: number;
  silenceRatioPercent: number;
  midSilenceCount: number;
  loudnessVariationDb: number | null;
  distortionPossible: boolean;
  segmentation: DdkPatternAnalysis;
};

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index];
}

function getAudioContext() {
  const AudioContextCtor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error("AudioContext is not supported in this browser.");
  }

  return new AudioContextCtor();
}

export async function analyzeRecordingBlob(blob: Blob, taskId: ClinicalTaskType): Promise<AcousticAnalysis> {
  const audioContext = getAudioContext();

  try {
    const buffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
    const sampleRate = buffer.sampleRate;
    const totalSamples = buffer.length;
    const totalDurationSecond = buffer.duration;
    const channelData = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
    const mono = new Float32Array(totalSamples);

    for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex += 1) {
      let sampleSum = 0;
      for (const channel of channelData) {
        sampleSum += channel[sampleIndex] ?? 0;
      }
      mono[sampleIndex] = sampleSum / channelData.length;
    }

    const frameSize = Math.max(1, Math.round(sampleRate * 0.02));
    const rmsFrames: Array<{ time: number; rms: number }> = [];
    let clippedSamples = 0;

    for (let offset = 0; offset < mono.length; offset += frameSize) {
      let squareSum = 0;
      const end = Math.min(mono.length, offset + frameSize);

      for (let index = offset; index < end; index += 1) {
        const sample = mono[index] ?? 0;
        squareSum += sample * sample;
        if (Math.abs(sample) >= 0.98) {
          clippedSamples += 1;
        }
      }

      const rms = Math.sqrt(squareSum / Math.max(1, end - offset));
      rmsFrames.push({ time: offset / sampleRate, rms });
    }

    const rmsValues = rmsFrames.map((frame) => frame.rms);
    const maxRms = Math.max(...rmsValues, 0);
    const noiseFloor = percentile(rmsValues, 0.2);
    const voicedThreshold = Math.max(noiseFloor * 2.5, maxRms * 0.08, 0.002);
    const voicedFrames = rmsFrames.filter((frame) => frame.rms >= voicedThreshold);
    const voicedDurationSecond = voicedFrames.length * frameSize / sampleRate;
    const silenceRatioPercent =
      totalDurationSecond > 0
        ? Math.max(0, Math.min(100, ((totalDurationSecond - voicedDurationSecond) / totalDurationSecond) * 100))
        : 0;

    let midSilenceCount = 0;
    let silenceRunSecond = 0;
    let hasVoicedStarted = false;

    for (const frame of rmsFrames) {
      const isVoiced = frame.rms >= voicedThreshold;
      if (isVoiced) {
        if (hasVoicedStarted && silenceRunSecond >= 0.25) {
          midSilenceCount += 1;
        }
        hasVoicedStarted = true;
        silenceRunSecond = 0;
      } else if (hasVoicedStarted) {
        silenceRunSecond += frameSize / sampleRate;
      }
    }

    const voicedDbValues = voicedFrames.map((frame) => 20 * Math.log10(Math.max(frame.rms, 0.000001)));
    const loudnessVariationDb = standardDeviation(voicedDbValues);
    const smoothedFrames = rmsFrames.map((frame, index) => {
      const neighbors = rmsFrames.slice(Math.max(0, index - 1), Math.min(rmsFrames.length, index + 2));
      return {
        time: frame.time,
        rms: neighbors.reduce((sum, neighbor) => sum + neighbor.rms, 0) / neighbors.length,
      };
    });
    const peakThreshold = Math.max(voicedThreshold * 1.25, maxRms * 0.16);
    const peaks: number[] = [];
    const minPeakGapSecond = 0.09;

    for (let index = 1; index < smoothedFrames.length - 1; index += 1) {
      const previous = smoothedFrames[index - 1];
      const current = smoothedFrames[index];
      const next = smoothedFrames[index + 1];

      if (!previous || !current || !next) {
        continue;
      }

      if (current.rms >= peakThreshold && current.rms >= previous.rms && current.rms > next.rms) {
        const lastPeak = peaks[peaks.length - 1];
        if (lastPeak === undefined || current.time - lastPeak >= minPeakGapSecond) {
          peaks.push(current.time);
        }
      }
    }

    return {
      totalDurationSecond,
      voicedDurationSecond,
      silenceRatioPercent,
      midSilenceCount,
      loudnessVariationDb,
      distortionPossible: clippedSamples / Math.max(1, totalSamples) > 0.005,
      segmentation: analyzeDdkPattern({
        taskId,
        peaks,
        totalDurationSecond,
        voicedDurationSecond,
        targetSyllables: getTargetSyllables(taskId),
      }),
    };
  } finally {
    void audioContext.close();
  }
}
