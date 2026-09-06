"use client";

import { useSyncExternalStore } from "react";

interface ChatTimestampProps {
  className: string;
  dateTime: string;
}

interface LocalTimestampProps extends ChatTimestampProps {
  formatter: Intl.DateTimeFormat;
  loadingLabel: string;
}

const inboxDateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});

const messageTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const subscribeToBrowserLocale = () => {
  return () => {};
};

const getServerTimestamp = () => "";

const LocalTimestamp = ({
  className,
  dateTime,
  formatter,
  loadingLabel,
}: LocalTimestampProps) => {
  const formattedTimestamp = useSyncExternalStore(
    subscribeToBrowserLocale,
    () => formatter.format(new Date(dateTime)),
    getServerTimestamp,
  );

  return (
    <time dateTime={dateTime} className={className}>
      {formattedTimestamp || <span className="sr-only">{loadingLabel}</span>}
    </time>
  );
};

export const InboxTimestamp = ({ className, dateTime }: ChatTimestampProps) => {
  return (
    <LocalTimestamp
      className={className}
      dateTime={dateTime}
      formatter={inboxDateFormatter}
      loadingLabel="Loading local message date"
    />
  );
};

export const MessageTimestamp = ({
  className,
  dateTime,
}: ChatTimestampProps) => {
  return (
    <LocalTimestamp
      className={className}
      dateTime={dateTime}
      formatter={messageTimeFormatter}
      loadingLabel="Loading local message time"
    />
  );
};

/*
 * The server snapshot intentionally contains no formatted clock value. The
 * first browser snapshot then formats the ISO instant with that browser's
 * locale and timezone, avoiding an EC2-timezone hydration mismatch.
 */
