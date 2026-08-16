import { GetScheduleCommand, SchedulerClient, UpdateScheduleCommand } from "@aws-sdk/client-scheduler";

const scheduler = new SchedulerClient({});

/** Disables only this project's schedules when the account-wide USD budget fires. */
export async function handler(): Promise<void> {
  const names = (process.env.SCHEDULE_NAMES ?? "").split(",").map((name) => name.trim()).filter(Boolean);
  const group = process.env.SCHEDULE_GROUP ?? "default";
  await Promise.all(names.map(async (Name) => {
    const schedule = await scheduler.send(new GetScheduleCommand({ Name, GroupName: group }));
    if (schedule.State === "DISABLED") return;
    await scheduler.send(new UpdateScheduleCommand({
      Name,
      GroupName: group,
      State: "DISABLED",
      ScheduleExpression: schedule.ScheduleExpression!,
      ScheduleExpressionTimezone: schedule.ScheduleExpressionTimezone,
      FlexibleTimeWindow: schedule.FlexibleTimeWindow!,
      Target: schedule.Target!,
      Description: schedule.Description,
      StartDate: schedule.StartDate,
      EndDate: schedule.EndDate,
    }));
  }));
}
