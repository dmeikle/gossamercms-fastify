export class ListResultset {
  constructor(list, page, pageSize, totalCount, totalPages) {
    this.list = list;
    this.page = page;
    this.pageSize = pageSize;
    this.totalCount = totalCount;
    this.totalPages = totalPages;
  }

  static of(list, page, pageSize, totalCount) {
    if (pageSize === -1) {
      const size = list.length;
      return new ListResultset(list, page, size, size, 1);
    }

    const quotient = totalCount / pageSize;
    const pages = Math.ceil(quotient);
    const totalPages = Number.isFinite(pages) ? pages : 2147483647;

    return new ListResultset(
      list,
      page,
      pageSize,
      totalCount,
      totalPages,
    );
  }
}
