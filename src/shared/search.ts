export function searchable(
  displayName: string,
  aliases: string[],
  query: string,
): boolean {
  return [displayName, ...aliases]
    .join(" ")
    .toLocaleLowerCase("ko-KR")
    .includes(query.toLocaleLowerCase("ko-KR"));
}
