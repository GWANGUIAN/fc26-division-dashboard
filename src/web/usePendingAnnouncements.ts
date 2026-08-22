import { useEffect, useState } from "react";
import { ANNOUNCEMENTS_SORTED, type Announcement } from "./announcementsData";
import { loadSeenAnnouncementIds, markAnnouncementsSeen } from "./storage";

export function usePendingAnnouncements() {
  const [pendingAnnouncements, setPendingAnnouncements] = useState<
    Announcement[]
  >([]);
  useEffect(() => {
    const seenIds = loadSeenAnnouncementIds();
    const unseen = ANNOUNCEMENTS_SORTED.filter(
      (announcement) => !seenIds.has(announcement.id),
    );
    if (unseen.length) setPendingAnnouncements(unseen);
  }, []);
  function dismiss() {
    setPendingAnnouncements([]);
  }
  function acknowledge() {
    markAnnouncementsSeen(
      pendingAnnouncements.map((announcement) => announcement.id),
    );
    setPendingAnnouncements([]);
  }
  return { pendingAnnouncements, dismiss, acknowledge };
}
