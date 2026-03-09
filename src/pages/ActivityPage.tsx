import ActivityTimeline from "@/components/ActivityTimeline";

const ActivityPage = () => {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="text-sm text-muted-foreground">Platform-wide activity feed across all businesses.</p>
      </div>
      <ActivityTimeline />
    </div>
  );
};

export default ActivityPage;
