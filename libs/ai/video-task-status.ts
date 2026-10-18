import { queryVideoTask } from './video';
import { getVideoTaskRecord, markVideoTaskSucceeded, markVideoTaskFailed, refundFailedVideoTask } from './video-task-store';

export async function refreshVideoTask(taskId: string, userId: string) {
  let task = await getVideoTaskRecord(taskId, userId);
  if (!task) return undefined;
  if (task.status === 'processing') {
    const providerTask = await queryVideoTask(task.provider, task.model, task.providerTaskId);
    if (providerTask.status === 'succeeded' && providerTask.result) {
      task = await markVideoTaskSucceeded(taskId, userId, providerTask.result);
    } else if (providerTask.status === 'failed') {
      task = await markVideoTaskFailed(taskId, userId, providerTask.errorMessage || 'Video generation failed');
    } else {
      // Another request may already have finalized the task while this one polled.
      task = await getVideoTaskRecord(taskId, userId);
    }
  }
  if (task?.status === 'failed' && !task.refunded && task.creditCost > 0) {
    // An unsuccessful refund remains retryable on the next poll.
    task = await refundFailedVideoTask(taskId, userId);
  }
  return task;
}
