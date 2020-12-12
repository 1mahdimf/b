var request = require('request');

var headers = {
    'accept': 'application/json, text/plain, */*',
    'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjllZjJmNDQ5MDk3NjljZjdjMmFiMjdlYWNmZTI0NzE4IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODI5NTg4MzEsImV4cCI6MTU4Mjk4MDQzMSwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50LmVtb2ZpZC5jb20iLCJhdWQiOlsiaHR0cHM6Ly9hY2NvdW50LmVtb2ZpZC5jb20vcmVzb3VyY2VzIiwiZWFzeTJfYXBpIl0sImNsaWVudF9pZCI6ImVhc3kyX2NsaWVudCIsInN1YiI6IjJkNDU4ZWJjLTYzNDQtNGEzZS1iMjhiLTI2ODQyODAyMWE4NSIsImF1dGhfdGltZSI6MTU4Mjk1ODgzMSwiaWRwIjoibG9jYWwiLCJwayI6IjJkNDU4ZWJjLTYzNDQtNGEzZS1iMjhiLTI2ODQyODAyMWE4NSIsInR3b19mYWN0b3JfZW5hYmxlZCI6ImZhbHNlIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiMmQ0NThlYmMtNjM0NC00YTNlLWIyOGItMjY4NDI4MDIxYTg1IiwibmFtZSI6IjJkNDU4ZWJjLTYzNDQtNGEzZS1iMjhiLTI2ODQyODAyMWE4NSIsImVtYWlsIjoiMjAwN21qbUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfbnVtYmVyIjoiMDkxNjMwNzMwMjEiLCJwaG9uZV9udW1iZXJfdmVyaWZpZWQiOnRydWUsIm5hdGlvbmFsX2lkIjoiMTg3MDI0NTAwOCIsIm5hdGlvbmFsX2lkX3ZlcmlmaWVkIjoidHJ1ZSIsImN1c3RvbWVyX2lzaW4iOiIxMTI5MTg3MDI0NTAwOCIsInNjb3BlIjpbIm9wZW5pZCIsImVhc3kyX2FwaSJdLCJhbXIiOlsicHdkIl19.nbIQAE7z82HPZnovTjr413kGAqSUO4ShKC0IkkK9qUa21DXCxbe3DXR7rndPbr8f7zAeN1IJ0mzxUC2fiumfVtmHLKcXO2CMaW9LoueTl6On4pnj-m7TbMXcTT_8S9bZypMiGMLm0UNtSEV-uSW6x0JV0DoBRMKjWdzT87OlHTxEl_U4LzAeWa1ST_MLJszSCkA2p6QhH8HK46d3olax15d1wEtyb4c6Vkkf9iPlvEGdcPi9aoS93qTqDjr8NuH8cDohQvAVIARq_OG1XCbcqBCCYYjE5HnPzm_2dVvN7M-1_TzjEczKmGXz5fNbbFJLkQenqimkIet6Z5nQIcR0yA',
    'cache-control': 'no-cache',
    'content-type': 'application/json',
    'postman-token': '5e88ee4a-ee52-5629-f1f8-2b8a95e6a54a',
    'referer': 'https://d.easytrader.emofid.com/',
    'sec-fetch-dest': 'empty',
    'user-agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36'
};

var dataString = {
	"isin": "IRO1GARN0001",
	"financeId": 1,
	"quantity": 8889,
	"price": 22603,
	"side": 0,
	"validityType": 74,
	"validityDateJalali": "1398/12/10",
	"easySource": 1,
	"referenceKey": "cdbe31c8-d9d9-48c8-905f-9bef10a63a09"
};

var options = {
    url: 'https://d11.emofid.com/easy/api/OmsOrder',
    method: 'POST',
    headers: headers,
    body: JSON.stringify(dataString)
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
}

request(options, callback);

