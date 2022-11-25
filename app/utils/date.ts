export function format(date?: string) {
  if (date === undefined) {
    throw new Error("Must provide date");
  }

  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );

  const intervals = [
    {
      label: "year",
      seconds: 365 * 24 * 60 * 60,
    },
    {
      label: "month",
      seconds: 30 * 24 * 60 * 60,
    },
    {
      label: "day",
      seconds: 24 * 60 * 60,
    },
    {
      label: "hour",
      seconds: 60 * 60,
    },
    {
      label: "minute",
      seconds: 60,
    },
  ];

  for (const interval of intervals) {
    const time = Math.floor(seconds / interval.seconds);

    if (time >= 1) {
      return `${time} ${interval.label}${time > 1 ? "s" : ""}`;
    }
  }

  return `${seconds} seconds`;
}
