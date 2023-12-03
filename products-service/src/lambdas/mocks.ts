const ids = new Array(100).fill(null).map((_, index) => index);

const products = ids.map((id) => ({
  id: String(id),
  title: `TV LG QLED00${id}`,
  description: `Awesome description for TV LG QLED00${id}`,
  price: (id + 1 ) * 10,
}));

const stocks = ids.map((id) => ({
  product_id: String(id),
  count: Math.round(100 * Math.random()),
}));

export { products, stocks };
