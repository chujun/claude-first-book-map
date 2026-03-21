const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('数据验证 - 国家/地区归属', () => {

  let bookData;

  test.beforeAll(async () => {
    // 加载书籍数据
    const dataPath = path.join(__dirname, '..', 'data', 'douban_books.json');
    const jsonContent = fs.readFileSync(dataPath, 'utf-8');
    bookData = JSON.parse(jsonContent);
  });

  test('美洲国家应该有 Americas region', async () => {
    const americasCountries = ['美国', '加拿大', '墨西哥', '巴西', '阿根廷', '哥伦比亚', '智利', '秘鲁'];

    const mismatchedBooks = bookData.filter(book =>
      americasCountries.includes(book.country) && book.region !== 'Americas'
    );

    if (mismatchedBooks.length > 0) {
      const details = mismatchedBooks.map(b =>
        `${b.country}: "${b.title}" 的 region 是 ${b.region}，应为 Americas`
      ).join('\n');
      console.log('发现归属错误:\n' + details);
    }

    expect(mismatchedBooks.length).toBe(0);
  });

  test('中国应该有 Asia region', async () => {
    const mismatchedBooks = bookData.filter(book =>
      book.country === '中国' && book.region !== 'Asia'
    );

    if (mismatchedBooks.length > 0) {
      const details = mismatchedBooks.map(b =>
        `"${b.title}" 的 region 是 ${b.region}，应为 Asia`
      ).join('\n');
      console.log('发现归属错误:\n' + details);
    }

    expect(mismatchedBooks.length).toBe(0);
  });

  test('欧洲国家应该有 Europe region', async () => {
    const europeCountries = ['英国', '法国', '德国', '意大利', '西班牙', '俄罗斯', '波兰', '奥地利', '瑞典', '爱尔兰', '葡萄牙', '丹麦'];

    const mismatchedBooks = bookData.filter(book =>
      europeCountries.includes(book.country) && book.region !== 'Europe'
    );

    if (mismatchedBooks.length > 0) {
      const details = mismatchedBooks.map(b =>
        `${b.country}: "${b.title}" 的 region 是 ${b.region}，应为 Europe`
      ).join('\n');
      console.log('发现归属错误:\n' + details);
    }

    expect(mismatchedBooks.length).toBe(0);
  });

  test('亚洲国家应该有 Asia region', async () => {
    const asiaCountries = ['日本', '韩国', '印度', '马来西亚'];

    const mismatchedBooks = bookData.filter(book =>
      asiaCountries.includes(book.country) && book.region !== 'Asia'
    );

    if (mismatchedBooks.length > 0) {
      const details = mismatchedBooks.map(b =>
        `${b.country}: "${b.title}" 的 region 是 ${b.region}，应为 Asia`
      ).join('\n');
      console.log('发现归属错误:\n' + details);
    }

    expect(mismatchedBooks.length).toBe(0);
  });

  test('大洋洲国家应该有 Oceania region', async () => {
    const oceaniaCountries = ['澳大利亚', '新西兰'];

    const mismatchedBooks = bookData.filter(book =>
      oceaniaCountries.includes(book.country) && book.region !== 'Oceania'
    );

    if (mismatchedBooks.length > 0) {
      const details = mismatchedBooks.map(b =>
        `${b.country}: "${b.title}" 的 region 是 ${b.region}，应为 Oceania`
      ).join('\n');
      console.log('发现归属错误:\n' + details);
    }

    expect(mismatchedBooks.length).toBe(0);
  });
});
