const { DEFAULT_PAGINATE_LIMIT } = require("../constants/config");

exports.paginate = async (
  delegate,
  { limit = DEFAULT_PAGINATE_LIMIT, cursor, flatten, ...args },
) => {
  const rows = await delegate.findMany({
    ...args,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: flatten ? items.map(flatten) : items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
};
