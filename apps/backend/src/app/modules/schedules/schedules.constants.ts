// BullMQ reminder job name and the deterministic jobId used to find/cancel it.
export const REMINDER_JOB_NAME = 'reminder'
export const scheduleJobId = (scheduleId: string) => `schedule:${scheduleId}`
