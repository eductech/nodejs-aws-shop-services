const products = new Array(100).fill(null).map((_, index) => ({
  id: String(index),
  title: `TV LG QLED00${index}`,
  description: `Awesome description for TV LG QLED00${index}`,
  price: (index + 1 ) * 10,
}));

export { products };
