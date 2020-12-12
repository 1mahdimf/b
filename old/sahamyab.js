var request = require('request');

const { delay } = require('./helpers/index');
const { config } = require('./config');

const symbolList = config.symbolList;

const tokenList = [
    'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkMEkzcHg5c2x2VkpCWDg1ODdTcjF5ZU1uMEUwZjRRb21lR08zMngyeVQ4In0.eyJqdGkiOiJmZjU0OWZkMC1iYTA0LTQ0Y2QtOGQ2OC0wMDhjOTBlZGQ3ZmQiLCJleHAiOjE1ODM0Mjg2NjksIm5iZiI6MCwiaWF0IjoxNTgzNDI4MDY5LCJpc3MiOiJodHRwOi8va2V5Y2xvYWs6OTA4MC9hdXRoL3JlYWxtcy9zYWhhbXlhYiIsImF1ZCI6InNhaGFteWFiIiwic3ViIjoiODZjMDdkMDQtYmVjYy00YmRmLWFiYTItNGU4N2EyNTY2YTBjIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoic2FoYW15YWIiLCJhdXRoX3RpbWUiOjAsInNlc3Npb25fc3RhdGUiOiJiMDk0YzEyMi1iYmZkLTQzZjMtYTBjNi01Yzg5NzFhNjRiZDUiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vKi5zYWhhbXlhYi5jb20iXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIlJPTEVfVVNFUiIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6ImVtYWlsIHByb2ZpbGUiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiLYrNmI2KfYryIsInByZWZlcnJlZF91c2VybmFtZSI6ImphdmFkMDEwIiwiZ2l2ZW5fbmFtZSI6Itis2YjYp9ivIn0.U9nUMSbGOjJL9mD9knjW_bu6g89gD_XQBrRhomMp8nV-HnHCqA4khwbnFrLXgnKiTy2hewBbc_nuUosEUjiYIXNTgAR8SmhZKiCQXmcS0CYSI47qP9BxGvRmYFbHuzR_MDqRAfZVNRyhC-HYT1K4XCTi10PZRwaco-9v5R-fPDPK5P0XYsLH0twSGp1mSVM_SNBKlYe2aZBAH_gtKn2oH-pWcztH4jcAenBjavhRJ3XdIFcu0cU-ZJRp2J6XL7LV9NW0OZ4yR2D38VCk0Djt1knPzqXlH9KFzodB1mxczuOFcOkwR9cg2PdZgUK2QyFIPQAZ04ZECUcIgC8M-XMQOQ',
    
];

const bodyList = [
	'حالا فهمیدید چرا برای اولین بار امروز 2 تا عرضه اولیه توی یه روز داشتیم؟!\
\
میخواستن ذهن ها رو روی عدد 2 آماده کنند!\
\
یه دلیل دیگشم میخواستن رکب بزنن ذهن ها رو به سمت یه اتفاق جذاب 2 تا عرضه اولیه در یک روز منحرف کنند!\
\
شک نکنید این 2 اتفاقِ 2 عرضه و 2 درصد همزمان، تصادفی نبوده!',
	'فقط یک نفر منو روشن کنه که چطور این قانون به نفع حقوق و منافع منه؟!\
\
قانون مزخرف میزارید، لطفاً دیگه به شعور من توهین نکنید!!!\
اَه! مرسی!',
	'اون موقع که دامنه نوسان بازار پایه از 10 درصد به 1 تا 3 کاهش یافت، سازمان دلیل رو اینطور اعلام کرده بود که به خاطر کاهش ریسک و جلوگیری از ضرر و زیان زیاد سهام داران است چون سهام بازارهای پایه ریسک دارند.\
این قانون جدید 2 درصدی هم حتماً در همین راستا و به همین دلیل است.\
\
حالا یه سوال #جدی من دارم، الان که دامنه میخواد از 5 به 2 درصد کم بشه، یعنی ریسک بازار اصلی چطوری یهویی بیشتر از بازار پایه زردی که 3 درصد بود شد!!! اصلاً چرا یک شبه ریسک بازار اصلی بورس زیاد شد که به تکاپو افتادن دامنه رو کم کنند؟!\
\
حالا من یه #پیشنهاد کاملاً #جدی دارم:\
اگر واقعاً به فکر جلوگیری از ضرر سرمایه گذران هستید، دامنه نوسان رو 2- و 5+ کنید!\
اینطوری جلوی ضرر رو گرفتید ولی جلوی سود رو هم نگرفتید. خیلی ساده و منطقیه!\
\
مگر اینکه دلایل پشت پرداه دیگری بوده باشه.',
	'- اول سال دامنه بازار پایه رو از 10% به 1 تا 3 درصد کاهش دادن.\
\
- دو سه هفته پیش قانون فروش تعهدی رو گذاشتن (که این ذاتاً بد نیست ولی برای صف های خرید که خوراکه منه، سَمه!)\
\
- هفته پیش قانونی گذاشتن که کد بورسی جدید بخوای باید آزمون بدی و یک ماه طول میکشه فعال بشه. (فعلاً هم که کلاً شنیدم کارگزاری ها اصلاً ثبت نام رو متوقف کردن)\
\
- اول همین هفته حجم مبنا رو در بازاری که نداشت، اضافه و در بازار دیگر افزایشش هم دادند.\
\
- الانم آخر هفته دامنه بازار اصلی رو از 5 به 2 درصد کاهش دادند!\
\
همه عزمشون رو جزم کردن که به هر شکلی شده رشد بازار رو متوقف کنند!\
اینم عیدی آخر سال! 1398/12/14',
	'میدونید چرا این موقع، این قانون رو اجرایی کردن؟!\
\
چون مردم شورش میکنند! اما الان به خاطر ترس از کرونا نمیتونن تظاهرات کنند!\
\
اصلاً شاید کرونا هم زیر سر سازمان بورسه و هدف رسیدن به همین نقطه بوده!\
',
	'سامانه ثبت شکایت که از دسترس خارج کردید، ما هم اَر اَر...!',
];

symbolList.forEach(symbolItem => {
	if (!symbolItem.symbol) continue;

	const headers = {
		Accept: 'application/json, text/plain, */*',
		Referer: `https://www.sahamyab.com/hashtag/${symbolItem.symbol}`,
		'Sec-Fetch-Dest': 'empty',
		Authorization: tokenList[0],
		'User-Agent':
			'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36',
		'Content-Type': 'application/json',
	};

	const dataString = {
		body: `#${symbolItem.symbol} ${bodyList[0]}`,
		group: 'false',
	};

	const options = {
		url: 'https://www.sahamyab.com/app/twiter/post?v=0.1',
		method: 'POST',
		headers: headers,
		body: JSON.stringify(dataString),
	};

	request(options, (error, response, body) => {
		if (!error && response.statusCode == 200) {
			console.log(body);
		} else {
			console.log(response && response.statusCode, error);
		}
	});

	delay(10000); // 10 sec
});
