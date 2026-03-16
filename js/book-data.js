// 全球 Top 100 书籍数据
// 包含书籍名称、作者、国家/地区、坐标、类别等信息

const bookData = [
    // 欧洲 - 英国 (15本)
    { rank: 1, title: "Pride and Prejudice", author: "Jane Austen", country: "英国", countryCode: "GB", region: "Europe", lat: 52.2053, lng: -0.1218, category: "novel", year: 1813, description: "傲慢与偏见 - 经典英国文学，讲述伊丽莎白·班纳特与达西先生的爱情故事。" },
    { rank: 2, title: "1984", author: "George Orwell", country: "英国", countryCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, category: "dystopia", year: 1949, description: "一九八四 - 极权主义的反乌托邦小说，影响深远。" },
    { rank: 3, title: "The Lord of the Rings", author: "J.R.R. Tolkien", country: "英国", countryCode: "GB", region: "Europe", lat: 51.7548, lng: -1.2544, category: "fantasy", year: 1954, description: "指环王 - 史诗奇幻文学的里程碑作品。" },
    { rank: 4, title: "Jane Eyre", author: "Charlotte Brontë", country: "英国", countryCode: "GB", region: "Europe", lat: 53.9614, lng: -1.6219, category: "novel", year: 1847, description: "简爱 - 经典的女性成长小说。" },
    { rank: 5, title: "Wuthering Heights", author: "Emily Brontë", country: "英国", countryCode: "GB", region: "Europe", lat: 53.9921, lng: -1.9543, category: "novel", year: 1847, description: "呼啸山庄 - 哥特式爱情悲剧。" },
    { rank: 6, title: "The Great Gatsby", author: "F. Scott Fitzgerald", country: "美国", countryCode: "US", region: "Americas", lat: 40.7128, lng: -74.0060, category: "novel", year: 1925, description: "了不起的盖茨比 - 爵士时代的经典文学作品。" },
    { rank: 7, title: "To Kill a Mockingbird", author: "Harper Lee", country: "美国", countryCode: "US", region: "Americas", lat: 32.3792, lng: -86.3077, category: "novel", year: 1960, description: "杀死一只知更鸟 - 关于种族偏见和正义的经典小说。" },
    { rank: 8, title: "Animal Farm", author: "George Orwell", country: "英国", countryCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, category: "satire", year: 1945, description: "动物农场 - 政治寓言小说。" },
    { rank: 9, title: "The Catcher in the Rye", author: "J.D. Salinger", country: "美国", countryCode: "US", region: "Americas", lat: 40.7831, lng: -73.9712, category: "novel", year: 1951, description: "麦田里的守望者 - 青春文学经典。" },
    { rank: 10, title: "Brave New World", author: "Aldous Huxley", country: "英国", countryCode: "GB", region: "Europe", lat: 51.4719, lng: -0.0924, category: "dystopia", year: 1932, description: "美丽新世界 - 反乌托邦科幻小说。" },

    // 欧洲 - 法国 (12本)
    { rank: 11, title: "Les Misérables", author: "Victor Hugo", country: "法国", countryCode: "FR", region: "Europe", lat: 48.8566, lng: 2.3522, category: "novel", year: 1862, description: "悲惨世界 - 法国文学巨著。" },
    { rank: 12, title: "The Stranger", author: "Albert Camus", country: "法国", countryCode: "FR", region: "Europe", lat: 43.2965, lng: 5.3698, category: "philosophical", year: 1942, description: "局外人 - 存在主义文学经典。" },
    { rank: 13, title: "Madame Bovary", author: "Gustave Flaubert", country: "法国", countryCode: "FR", region: "Europe", lat: 49.1829, lng: -0.3707, category: "novel", year: 1857, description: "包法利夫人 - 现实主义小说典范。" },
    { rank: 14, title: "The Count of Monte Cristo", author: "Alexandre Dumas", country: "法国", countryCode: "FR", region: "Europe", lat: 43.7102, lng: 7.2620, category: "adventure", year: 1844, description: "基督山伯爵 - 经典复仇冒险小说。" },
    { rank: 15, title: "The Little Prince", author: "Antoine de Saint-Exupéry", country: "法国", countryCode: "FR", region: "Europe", lat: 43.6047, lng: 1.4442, category: "children", year: 1943, description: "小王子 - 哲理童话寓言。" },
    { rank: 16, title: "The Adventures of Huckleberry Finn", author: "Mark Twain", country: "美国", countryCode: "US", region: "Americas", lat: 35.1495, lng: -90.0490, category: "adventure", year: 1884, description: "哈克贝利·费恩历险记 - 美国文学经典。" },
    { rank: 17, title: "Moby Dick", author: "Herman Melville", country: "美国", countryCode: "US", region: "Americas", lat: 41.3163, lng: -72.9253, category: "adventure", year: 1851, description: "白鲸 - 美国文学巅峰之作。" },
    { rank: 18, title: "War and Peace", author: "Leo Tolstoy", country: "俄罗斯", countryCode: "RU", region: "Europe", lat: 55.7558, lng: 37.6173, category: "novel", year: 1869, description: "战争与和平 - 史诗级俄罗斯文学。" },
    { rank: 19, title: "Anna Karenina", author: "Leo Tolstoy", country: "俄罗斯", countryCode: "RU", region: "Europe", lat: 55.7558, lng: 37.6173, category: "novel", year: 1877, description: "安娜·卡列尼娜 - 经典爱情悲剧。" },
    { rank: 20, title: "Crime and Punishment", author: "Fyodor Dostoevsky", country: "俄罗斯", countryCode: "RU", region: "Europe", lat: 59.9311, lng: 30.3609, category: "psychological", year: 1866, description: "罪与罚 - 心理现实主义杰作。" },

    // 欧洲 - 德国/西班牙/意大利 (10本)
    { rank: 21, title: "Faust", author: "Johann Wolfgang von Goethe", country: "德国", countryCode: "DE", region: "Europe", lat: 50.1109, lng: 8.6821, category: "drama", year: 1808, description: "浮士德 - 德国文学巅峰之作。" },
    { rank: 22, title: "Don Quixote", author: "Miguel de Cervantes", country: "西班牙", countryCode: "ES", region: "Europe", lat: 40.4168, lng: -3.7038, category: "novel", year: 1605, description: "堂吉诃德 - 西方文学第一部现代小说。" },
    { rank: 23, title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", country: "哥伦比亚", countryCode: "CO", region: "Americas", lat: 6.2476, lng: -75.5658, category: "magical-realism", year: 1967, description: "百年孤独 - 魔幻现实主义代表作。" },
    { rank: 24, title: "The Divine Comedy", author: "Dante Alighieri", country: "意大利", countryCode: "IT", region: "Europe", lat: 43.7696, lng: 11.2558, category: "epic", year: 1320, description: "神曲 - 中世纪文学里程碑。" },
    { rank: 25, title: "The Decameron", author: "Giovanni Boccaccio", country: "意大利", countryCode: "IT", region: "Europe", lat: 43.7696, lng: 11.2558, category: "short-stories", year: 1353, description: "十日谈 - 文艺复兴时期经典。" },
    { rank: 26, title: "The Betrothed", author: "Alessandro Manzoni", country: "意大利", countryCode: "IT", region: "Europe", lat: 45.4642, lng: 9.1900, category: "novel", year: 1827, description: "约婚夫妇 - 意大利历史小说。" },
    { rank: 27, title: "Candide", author: "Voltaire", country: "法国", countryCode: "FR", region: "Europe", lat: 48.8566, lng: 2.3522, category: "philosophical", year: 1759, description: "老实人 - 启蒙主义哲学小说。" },
    { rank: 28, title: "The Death of Artemio Cruz", author: "Carlos Fuentes", country: "墨西哥", countryCode: "MX", region: "Americas", lat: 19.4326, lng: -99.1332, category: "novel", year: 1962, description: "阿尔特米奥·克鲁斯之死 - 墨西哥文学经典。" },
    { rank: 29, title: "The House of the Spirits", author: "Isabel Allende", country: "智利", countryCode: "CL", region: "Americas", lat: -33.4489, lng: -70.6693, category: "magical-realism", year: 1982, description: "幽灵之家 - 魔幻现实主义杰作。" },
    { rank: 30, title: "The Invention of Morel", author: "Bioy Casares", country: "阿根廷", countryCode: "AR", region: "Americas", lat: -34.6037, lng: -58.3816, category: "science-fiction", year: 1940, description: "莫雷尔的发明 - 阿根廷文学经典。" },

    // 美洲文学 (15本)
    { rank: 31, title: "One Flew Over the Cuckoo's Nest", author: "Ken Kesey", country: "美国", countryCode: "US", region: "Americas", lat: 45.3231, lng: -122.9765, category: "novel", year: 1962, description: "飞越疯人院 - 美国反体制文学经典。" },
    { rank: 32, title: "The Grapes of Wrath", author: "John Steinbeck", country: "美国", countryCode: "US", region: "Americas", lat: 36.7372, lng: -119.7871, category: "novel", year: 1939, description: "愤怒的葡萄 - 大萧条时期文学经典。" },
    { rank: 33, title: "Of Mice and Men", author: "John Steinbeck", country: "美国", countryCode: "US", region: "Americas", lat: 36.7372, lng: -119.7871, category: "novel", year: 1937, description: "人鼠之间 - 美国文学短篇经典。" },
    { rank: 34, title: "The Old Man and the Sea", author: "Ernest Hemingway", country: "美国", countryCode: "US", region: "Americas", lat: 24.0667, lng: -74.4833, category: "novel", year: 1952, description: "老人与海 - 诺贝尔文学奖作品。" },
    { rank: 35, title: "A Farewell to Arms", author: "Ernest Hemingway", country: "美国", countryCode: "US", region: "Americas", lat: 41.8781, lng: -87.6298, category: "novel", year: 1929, description: "永别了，武器 - 战争文学经典。" },
    { rank: 36, title: "Beloved", author: "Toni Morrison", country: "美国", countryCode: "US", region: "Americas", lat: 39.7392, lng: -104.9903, category: "novel", year: 1987, description: "宠儿 - 诺贝尔文学奖作品。" },
    { rank: 37, title: "Invisible Man", author: "Ralph Ellison", country: "美国", countryCode: "US", region: "Americas", lat: 40.7128, lng: -74.0060, category: "novel", year: 1952, description: "隐形人 - 种族主题文学经典。" },
    { rank: 38, title: "Catch-22", author: "Joseph Heller", country: "美国", countryCode: "US", region: "Americas", lat: 40.8448, lng: -73.8648, category: "satire", year: 1961, description: "第二十二条军规 - 黑色幽默经典。" },
    { rank: 39, title: "Slaughterhouse-Five", author: "Kurt Vonnegut", country: "美国", countryCode: "US", region: "Americas", lat: 41.2565, lng: -95.9345, category: "science-fiction", year: 1969, description: "五号屠场 - 反战科幻经典。" },
    { rank: 40, title: "The Sound and the Fury", author: "William Faulkner", country: "美国", countryCode: "US", region: "Americas", lat: 34.7304, lng: -92.2951, category: "novel", year: 1929, description: "喧哗与骚动 - 意识流文学经典。" },

    // 亚洲文学 (15本)
    { rank: 41, title: "Dream of the Red Chamber", author: "Cao Xueqin", country: "中国", countryCode: "CN", region: "Asia", lat: 39.9042, lng: 116.4074, category: "novel", year: 1791, description: "红楼梦 - 中国古典四大名著之一。" },
    { rank: 42, title: "Journey to the West", author: "Wu Cheng'en", country: "中国", countryCode: "CN", region: "Asia", lat: 31.2304, lng: 121.4737, category: "fantasy", year: 1592, description: "西游记 - 中国古典四大名著之一。" },
    { rank: 43, title: "Romance of the Three Kingdoms", author: "Luo Guanzhong", country: "中国", countryCode: "CN", region: "Asia", lat: 34.3416, lng: 108.9398, category: "historical", year: 1522, description: "三国演义 - 中国古典四大名著之一。" },
    { rank: 44, title: "Water Margin", author: "Shi Nai'an", country: "中国", countryCode: "CN", region: "Asia", lat: 32.0603, lng: 118.7969, category: "historical", year: 1589, description: "水浒传 - 中国古典四大名著之一。" },
    { rank: 45, title: "The Analects", author: "Confucius", country: "中国", countryCode: "CN", region: "Asia", lat: 35.8617, lng: 104.1954, category: "philosophy", year: -500, description: "论语 - 儒家经典著作。" },
    { rank: 46, title: "Tao Te Ching", author: "Lao Tzu", country: "中国", countryCode: "CN", region: "Asia", lat: 34.3416, lng: 108.9398, category: "philosophy", year: -400, description: "道德道 - 道家经典著作。" },
    { rank: 47, title: "The Tale of Genji", author: "Murasaki Shikibu", country: "日本", countryCode: "JP", region: "Asia", lat: 35.0116, lng: 135.7681, category: "novel", year: 1008, description: "源氏物语 - 日本文学巅峰之作。" },
    { rank: 48, title: "Norwegian Wood", author: "Haruki Murakami", country: "日本", countryCode: "JP", region: "Asia", lat: 35.6762, lng: 139.6503, category: "novel", year: 1987, description: "挪威的森林 - 当代日本文学经典。" },
    { rank: 49, title: "Kafka on the Shore", author: "Haruki Murakami", country: "日本", countryCode: "JP", region: "Asia", lat: 35.6762, lng: 139.6503, category: "magical-realism", year: 2002, description: "海边的卡夫卡 - 魔幻现实主义杰作。" },
    { rank: 50, title: "The Tale of the Heike", author: "Anonymous", country: "日本", countryCode: "JP", region: "Asia", lat: 35.0116, lng: 135.7681, category: "historical", year: 1371, description: "平家物语 - 日本古典文学。" },

    // 更多亚洲文学
    { rank: 51, title: "The Palace of Desire", author: "Gao Xingjian", country: "中国/法国", countryCode: "CN", region: "Asia", lat: 48.8566, lng: 2.3522, category: "novel", year: 1990, description: "灵山 - 诺贝尔文学奖作品。" },
    { rank: 52, title: "The Song of the Dodo", author: "Qiu Xiaolong", country: "中国", countryCode: "CN", region: "Asia", lat: 31.2304, lng: 121.4737, category: "mystery", year: 2000, description: "狄公案 - 中国推理小说经典。" },
    { rank: 53, title: "The Vegetarian", author: "Han Kang", country: "韩国", countryCode: "KR", region: "Asia", lat: 37.5665, lng: 126.9780, category: "novel", year: 2007, description: "素食者 - 韩国文学代表作。" },
    { rank: 54, title: "Please Look After Mother", author: "Shin Kyung-suk", country: "韩国", countryCode: "KR", region: "Asia", lat: 37.5665, lng: 126.9780, category: "novel", year: 2008, description: "请照顾好我的母亲 - 韩国文学畅销书。" },
    { rank: 55, title: "The Secret Garden", author: "Frances Hodgson Burnett", country: "英国", countryCode: "GB", region: "Europe", lat: 53.4808, lng: -2.2426, category: "children", year: 1911, description: "秘密花园 - 经典儿童文学作品。" },

    // 欧洲其他作品
    { rank: 56, title: "The Brothers Karamazov", author: "Fyodor Dostoevsky", country: "俄罗斯", countryCode: "RU", region: "Europe", lat: 59.9311, lng: 30.3609, category: "novel", year: 1880, description: "卡拉马佐夫兄弟 - 哲学小说经典。" },
    { rank: 57, title: "Eugene Onegin", author: "Alexander Pushkin", country: "俄罗斯", countryCode: "RU", region: "Europe", lat: 59.9343, lng: 30.3351, category: "poetry", year: 1833, description: "叶甫盖尼·奥涅金 - 俄罗斯诗歌巅峰。" },
    { rank: 58, title: "Dead Souls", author: "Nikolai Gogol", country: "俄罗斯", countryCode: "RU", region: "Europe", lat: 50.4501, lng: 30.5234, category: "satire", year: 1842, description: "死魂灵 - 俄国批判现实主义。" },
    { rank: 59, title: "The Master and Margarita", author: "Mikhail Bulgakov", country: "俄罗斯", countryCode: "RU", region: "Europe", lat: 55.7558, lng: 37.6173, category: "fantasy", year: 1967, description: "大师与玛格丽特 - 魔幻现实主义先驱。" },
    { rank: 60, title: "Doctor Zhivago", author: "Boris Pasternak", country: "俄罗斯", countryCode: "RU", region: "Europe", lat: 55.7558, lng: 37.6173, category: "novel", year: 1957, description: "日瓦戈医生 - 诺贝尔文学奖作品。" },

    // 拉美文学
    { rank: 61, title: "The Aleph", author: "Jorge Luis Borges", country: "阿根廷", countryCode: "AR", region: "Americas", lat: -34.6037, lng: -58.3816, category: "short-stories", year: 1949, description: "阿莱夫 - 拉美文学经典。" },
    { rank: 62, title: "Ficciones", author: "Jorge Luis Borges", country: "阿根廷", countryCode: "AR", region: "Americas", lat: -34.6037, lng: -58.3816, category: "short-stories", year: 1944, description: "虚构集 - 后现代文学经典。" },
    { rank: 63, title: "The Death of Artemio Cruz", author: "Carlos Fuentes", country: "墨西哥", countryCode: "MX", region: "Americas", lat: 19.4326, lng: -99.1332, category: "novel", year: 1962, description: "阿尔特米奥·克鲁斯之死 - 拉美文学经典。" },
    { rank: 64, title: "The Brief Wondrous Life of Oscar Wao", author: "Junot Díaz", country: "美国/多米尼加", countryCode: "US", region: "Americas", lat: 40.7128, lng: -74.0060, category: "novel", year: 2007, description: "奥斯卡·沃罗奇妙而短暂的一生 - 普利策奖作品。" },
    { rank: 65, title: "Like Water for Chocolate", author: "Laura Esquivel", country: "墨西哥", countryCode: "MX", region: "Americas", lat: 19.4326, lng: -99.1332, category: "magical-realism", year: 1989, description: "恰如水之于巧克力 - 魔幻现实主义烹饪小说。" },

    // 欧洲继续
    { rank: 66, title: "David Copperfield", author: "Charles Dickens", country: "英国", countryCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, category: "novel", year: 1850, description: "大卫·科波菲尔 - 狄更斯自传体小说。" },
    { rank: 67, title: "Oliver Twist", author: "Charles Dickens", country: "英国", countryCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, category: "novel", year: 1838, description: "雾都孤儿 - 社会批判文学经典。" },
    { rank: 68, title: "A Tale of Two Cities", author: "Charles Dickens", country: "英国", countryCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, category: "historical", year: 1859, description: "双城记 - 法国大革命题材经典。" },
    { rank: 69, title: "Great Expectations", author: "Charles Dickens", country: "英国", countryCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, category: "novel", year: 1861, description: "远大前程 - 狄易斯巅峰之作。" },
    { rank: 70, title: "Heart of Darkness", author: "Joseph Conrad", country: "英国/波兰", countryCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, category: "novella", year: 1899, description: "黑暗之心 - 殖民主义文学经典。" },

    // 更多美洲作品
    { rank: 71, title: "The Sun Also Rises", author: "Ernest Hemingway", country: "美国", countryCode: "US", region: "Americas", lat: 43.6532, lng: -7.2498, category: "novel", year: 1926, description: "太阳照常升起 - 迷惘的一代代表作。" },
    { rank: 72, title: "Gone with the Wind", author: "Margaret Mitchell", country: "美国", countryCode: "US", region: "Americas", lat: 33.7490, lng: -84.3880, category: "novel", year: 1936, description: "飘 - 美国内战文学经典。" },
    { rank: 73, title: "The Color Purple", author: "Alice Walker", country: "美国", countryCode: "US", region: "Americas", lat: 33.7490, lng: -84.3880, category: "novel", year: 1982, description: "紫色 - 普利策奖作品。" },
    { rank: 74, title: "Their Eyes Were Watching God", author: "Zora Neale Hurston", country: "美国", countryCode: "US", region: "Americas", lat: 25.7617, lng: -80.1918, category: "novel", year: 1937, description: "凝望上帝 - 哈莱姆文艺复兴代表作。" },
    { rank: 75, title: "The Road", author: "Cormac McCarthy", country: "美国", countryCode: "US", region: "Americas", lat: 35.4676, lng: -97.5164, category: "dystopia", year: 2006, description: "路 - 普利策奖作品。" },

    // 非洲/大洋洲文学
    { rank: 76, title: "Things Fall Apart", author: "Chinua Achebe", country: "尼日利亚", countryCode: "NG", region: "Africa", lat: 9.0765, lng: 7.3986, category: "novel", year: 1958, description: "瓦解 - 非洲文学里程碑。" },
    { rank: 77, title: "Season of Migration to the South", author: "Nayeb Ali", country: "苏丹", countryCode: "SD", region: "Africa", lat: 15.5007, lng: 32.5599, category: "novel", year: 1966, description: "向南方迁徙的季节 - 非洲现代文学经典。" },
    { rank: 78, title: "The Blind Assassin", author: "Margaret Atwood", country: "加拿大", countryCode: "CA", region: "Americas", lat: 43.6532, lng: -79.3832, category: "novel", year: 2000, description: "盲刺客 - 布克奖作品。" },
    { rank: 79, title: "The Handmaid's Tale", author: "Margaret Atwood", country: "加拿大", countryCode: "CA", region: "Americas", lat: 43.6532, lng: -79.3832, category: "dystopia", year: 1985, description: "使女的故事 - 反乌托邦文学经典。" },
    { rank: 80, title: "Life of Pi", author: "Yann Martel", country: "加拿大", countryCode: "CA", region: "Americas", lat: 43.6532, lng: -79.3832, category: "novel", year: 2001, description: "少年派的奇幻漂流 - 布克奖作品。" },

    // 继续亚洲
    { rank: 81, title: "The Good Earth", author: "Pearl S. Buck", country: "美国/中国", countryCode: "US", region: "Americas", lat: 39.9042, lng: 116.4074, category: "novel", year: 1931, description: "大地 - 赛珍珠中国题材作品。" },
    { rank: 82, title: "I Am Malala", author: "Malala Yousafzai", country: "巴基斯坦", countryCode: "PK", region: "Asia", lat: 33.6844, lng: 73.0479, category: "memoir", year: 2013, description: "我是马拉拉 - 诺贝尔和平奖作品。" },
    { rank: 83, title: "The White Tiger", author: "Aravind Adiga", country: "印度", countryCode: "IN", region: "Asia", lat: 19.0760, lng: 72.8777, category: "novel", year: 2008, description: "白虎 - 布克奖作品。" },
    { rank: 84, title: "Midnight's Children", author: "Salman Rushdie", country: "印度/英国", countryCode: "IN", region: "Asia", lat: 19.0760, lng: 72.8777, category: "magical-realism", year: 1981, description: "午夜之子 - 布克奖作品。" },
    { rank: 85, title: "The Namesake", author: "Jhumpa Lahiri", country: "美国/印度", countryCode: "US", region: "Americas", lat: 42.3601, lng: -71.0589, category: "novel", year: 2003, description: "译者之死 - 普利策奖作品。" },

    // 更多欧洲作品
    { rank: 86, title: "The Unbearable Lightness of Being", author: "Milan Kundera", country: "捷克/法国", countryCode: "CZ", region: "Europe", lat: 50.0755, lng: 14.4378, category: "philosophical", year: 1984, description: "生命中不能承受之轻 - 哲学小说经典。" },
    { rank: 87, title: "The Trial", author: "Franz Kafka", country: "奥地利/捷克", countryCode: "AT", region: "Europe", lat: 48.2082, lng: 16.3738, category: "dystopia", year: 1925, description: "审判 - 卡夫卡经典作品。" },
    { rank: 88, title: "The Metamorphosis", author: "Franz Kafka", country: "奥地利/捷克", countryCode: "AT", region: "Europe", lat: 48.2082, lng: 16.3738, category: "short-story", year: 1915, description: "变形记 - 存在主义文学经典。" },
    { rank: 89, title: "The Castle", author: "Franz Kafka", country: "奥地利/捷克", countryCode: "AT", region: "Europe", lat: 48.2082, lng: 16.3738, category: "novel", year: 1926, description: "城堡 - 卡夫卡未完成之作。" },
    { rank: 90, title: "Lolita", author: "Vladimir Nabokov", country: "俄罗斯/美国", countryCode: "US", region: "Americas", lat: 40.7128, lng: -74.0060, category: "novel", year: 1955, description: "洛丽塔 - 争议文学经典。" },

    // 更多作品
    { rank: 91, title: "The Picture of Dorian Gray", author: "Oscar Wilde", country: "爱尔兰", countryCode: "IE", region: "Europe", lat: 53.3498, lng: -6.2603, category: "novel", year: 1890, description: "道林·格雷的画像 - 美学主义文学经典。" },
    { rank: 92, title: "Frankenstein", author: "Mary Shelley", country: "英国", countryCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, category: "science-fiction", year: 1818, description: "科学怪人 - 科幻小说鼻祖。" },
    { rank: 93, title: "Dracula", author: "Bram Stoker", country: "爱尔兰", countryCode: "IE", region: "Europe", lat: 53.3498, lng: -6.2603, category: "horror", year: 1897, description: "德古拉 - 吸血鬼文学经典。" },
    { rank: 94, title: "Rebecca", author: "Daphne du Maurier", country: "英国", countryCode: "GB", region: "Europe", lat: 50.2638, lng: -5.0514, category: "gothic", year: 1938, description: "蝴蝶梦 - 哥特式悬疑小说。" },
    { rank: 95, title: "The Wind in the Willows", author: "Kenneth Grahame", country: "英国", countryCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, category: "children", year: 1908, description: "柳林风声 - 经典儿童文学作品。" },

    // 最后几本
    { rank: 96, title: "The Outsiders", author: "S.E. Hinton", country: "美国", countryCode: "US", region: "Americas", lat: 36.1540, lng: -95.9928, category: "novel", year: 1967, description: "局外人 - 青少年文学经典。" },
    { rank: 97, title: "The Giver", author: "Lois Lowry", country: "美国", countryCode: "US", region: "Americas", lat: 41.3163, lng: -72.9253, category: "young-adult", year: 1993, description: "赐予者 - 青少年反乌托邦文学。" },
    { rank: 98, title: "The Book Thief", author: "Markus Zusak", country: "澳大利亚", countryCode: "AU", region: "Oceania", lat: -33.8688, lng: 151.2093, category: "historical", year: 2005, description: "偷书贼 - 澳大利亚文学经典。" },
    { rank: 99, title: "Cloud Atlas", author: "David Mitchell", country: "英国", countryCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, category: "science-fiction", year: 2004, description: "云图 - 结构主义科幻小说。" },
    { rank: 100, title: "The Shadow of the Wind", author: "Carlos Ruiz Zafón", country: "西班牙", countryCode: "ES", region: "Europe", lat: 41.3851, lng: 2.1734, category: "mystery", year: 2001, description: "风之影 - 西班牙当代文学经典。" }
];

// 按地区分类的颜色映射
const regionColors = {
    "Europe": "#e74c3c",    // 红色 - 欧洲
    "Americas": "#3498db",  // 蓝色 - 美洲
    "Asia": "#2ecc71",      // 绿色 - 亚洲
    "Africa": "#f39c12",    // 橙色 - 非洲
    "Oceania": "#9b59b6"    // 紫色 - 大洋洲
};

// 获取国家的中心坐标（用于某些没有精确坐标的情况）
function getCountryCenter(countryCode) {
    const countryCenters = {
        "GB": { lat: 54.0, lng: -2.0 },
        "US": { lat: 39.8, lng: -98.5 },
        "FR": { lat: 46.2, lng: 2.2 },
        "DE": { lat: 51.2, lng: 10.4 },
        "RU": { lat: 61.5, lng: 105.3 },
        "ES": { lat: 40.4, lng: -3.7 },
        "IT": { lat: 41.9, lng: 12.6 },
        "CN": { lat: 35.9, lng: 104.2 },
        "JP": { lat: 36.2, lng: 138.3 },
        "IN": { lat: 20.6, lng: 78.9 },
        "KR": { lat: 35.9, lng: 127.7 },
        "MX": { lat: 23.6, lng: -102.5 },
        "AR": { lat: -38.4, lng: -63.6 },
        "CO": { lat: 4.6, lng: -74.3 },
        "CL": { lat: -35.7, lng: -71.5 },
        "CA": { lat: 56.1, lng: -106.3 },
        "AU": { lat: -25.3, lng: 133.8 },
        "NG": { lat: 9.1, lng: 8.7 },
        "SD": { lat: 15.0, lng: 30.0 },
        "PK": { lat: 30.4, lng: 69.3 },
        "IE": { lat: 53.4, lng: -8.2 },
        "AT": { lat: 47.5, lng: 14.5 },
        "CZ": { lat: 49.8, lng: 15.5 }
    };
    return countryCenters[countryCode] || { lat: 0, lng: 0 };
}

// 导出数据
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { bookData, regionColors, getCountryCenter };
}
