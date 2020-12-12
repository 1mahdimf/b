// const getTab = () => {
// 	chrome.tabs.query(
// 		{
// 			active: true,
// 			currentWindow: true,
// 		},
// 		tabs => {
// 			const tabURL = tabs[0].url;
// 			console.log('tabURL', tabURL);
// 		}
// 	);
// };

// const apiUrl = [
//   "http://79.175.176.169:3000",
//   "http://79.175.176.111:3000",
//   "http://46.4.144.70:3001",
//   "http://185.173.104.135:3000",
//   "http://127.0.0.1:3000",
// ];
const newApiUrl = ["http://46.4.144.70:3000", "http://185.173.104.135:3000"];

const getCookies = (domain) => {
  return new Promise((resolve, reject) => {
    if (domain == "" || domain == null) {
      console.log(
        "Invalid URL! <strong>Hint</strong> : Please enter <strong>complete url</strong> including <kbd>http://</kpd> or <kpd>https://</kpd> below and press <span class='label label-primary'>Display Cookies</span>"
      );
      return reject();
    }

    if (!(domain.indexOf("http://") == 0 || domain.indexOf("https://") == 0)) {
      console.log(
        "Invalid URL! <strong>Hint</strong> : Please enter <strong>complete url</strong> including <kbd>http://</kbd> or <kbd>https://</kbd> below and press <span class='label label-primary'>Display Cookies</span>"
      );
      return reject();
    } else {
      chrome.cookies.getAll({ url: domain }, function (cookies) {
        let cookieFilter = {};
        cookies.forEach((cookie) => {
          cookieFilter[cookie.name] = cookie.value;
        });
        return resolve(cookieFilter);
      });
    }
  });
};

const getLocalStorage = (tab, key) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(
      tab.id,
      { code: `localStorage['${key}']` },
      (result) => {
        if (!result || (result && result.length === 0)) return reject();

        try {
          return resolve(JSON.parse(result[0]));
        } catch (e) {
          return resolve(result[0]);
        }
      }
    );
  });
};

const getOnlineplusVariables = (tab) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(
      tab.id,
      { file: "scripts/onlineplus-var.js" },
      (data) => {
        return resolve(data[0].response);
      }
    );
  });
};

const getAgahVariables = (tab) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(
      tab.id,
      { code: "document.head.innerText;" },
      (data) => {
        const response = data[0];
        const Username = response.match(/"Username":"(.*?)",/);
        const CustomerId = response.match(/"CustomerId":(.*?),/);
        const Title = response.match(/"Title":"(.*?)",/);

        return resolve({
          Username: Username[1],
          CustomerId: CustomerId[1],
          Title: Title[1],
        });
      }
    );
  });
};

const getNahayatVariables = (tab) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(
      tab.id,
      { code: "document.getElementsByClassName('fullName')[0].title" },
      (data) => {
        const response = data[0];

        return resolve({
          Username: "",
          CustomerId: "",
          Title: response,
        });
      }
    );
  });
};

const getOnlineplusToken = (tab) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(
      tab.id,
      { code: "document.head.innerText;" },
      (data) => {
        const response = data[0];

        const authToken = response.match(
          /tokenManger.saveToken\('(.*?)'\);/
        )[1];
        const customerTitle = response.match(/CustomerName = '(.*?)';/)[1];
        const userName = response.match(/UserName ='(.*?)';/)[1];

        return resolve({ authToken, customerTitle, userName });
      }
    );
  });
};

const getFarabixoVariables = (tab) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(
      tab.id,
      { file: "scripts/farabixo-var.js" },
      (data) => {
        const res = data[0].response.userInfo;

        return resolve({
          bourseCode: res.bourseCode.tse.Id,
          farabiUsername: res.userName,
          userId: res.userId,
          userName: res.userCode,
          userTitle: res.userTitle,
        });
      }
    );
  });
};

chrome.browserAction.onClicked.addListener(async (tab) => {
  if (tab.url.indexOf("easytrader") !== -1) {
    console.log("run");

    const user = await getLocalStorage(tab, "User");
    const userInfo = await getLocalStorage(tab, "UserInfo");

    const data = JSON.stringify({
      token: `${user.token_type} ${user.access_token}`,
      customerTitle: userInfo.customerTitle,
      mfdOnlineUserName: userInfo.mfdOnlineUserName,
    });

    // sendRequest("/easytrader/set-token", data);
    sendRequest("/user/token", data, "PUT");
  } else if (
    tab.url.indexOf("mofidonline") !== -1 ||
    tab.url.indexOf("mobinsb") !== -1 ||
    tab.url.indexOf("onlinesahm") !== -1 ||
    tab.url.indexOf("sjb.co") !== -1 ||
    tab.url.indexOf("maskanbourse") !== -1 ||
    tab.url.indexOf("bmibourse") !== -1 ||
    tab.url.indexOf("danabrokers") !== -1 ||
    tab.url.indexOf("dp-broker") !== -1 ||
    tab.url.indexOf("samanbourse") !== -1 ||
    tab.url.indexOf("ipb.ir") !== -1 ||
    tab.url.indexOf("oibourse") !== -1
  ) {
    console.log("run");

    const cookies = await getCookies(tab.url);
    const cookieList = [];
    Object.keys(cookies).forEach((key) => {
      const value = cookies[key];
      cookieList.push(`${key}=${value}`);
    });
    const cookieString = cookieList.join(";");

    // const userInfo = await getOnlineplusVariables(tab);
    const userInfo = await getOnlineplusToken(tab);

    let broker = "";
    if (tab.url.indexOf("mofidonline") !== -1) {
      broker = "mofid";
    } else if (tab.url.indexOf("mobinsb") !== -1) {
      broker = "mobin";
    } else if (tab.url.indexOf("onlinesahm") !== -1) {
      broker = "moshaveransaham";
    } else if (tab.url.indexOf("sjb.co") !== -1) {
      broker = "sabajahad";
    } else if (tab.url.indexOf("maskanbourse") !== -1) {
      broker = "maskan";
    } else if (tab.url.indexOf("bmibourse") !== -1) {
      broker = "meli";
    } else if (tab.url.indexOf("danabrokers") !== -1) {
      broker = "dana";
    } else if (tab.url.indexOf("dp-broker") !== -1) {
      broker = "danayanpars";
    } else if (tab.url.indexOf("samanbourse") !== -1) {
      broker = "saman";
    } else if (tab.url.indexOf("ipb.ir") !== -1) {
      broker = "isatis";
    } else if (tab.url.indexOf("oibourse") !== -1) {
      broker = "ordibehesht";
    }

    const data = JSON.stringify({
      ...userInfo,
      cookie: cookieString,
      // customerTitle: userInfo.CustomerName,
      // userName: userInfo.UserName,
      // authToken,
      broker,
    });

    // sendRequest("/onlineplus/set-token", data);
    sendRequest("/user/token", data, "PUT");
  } else if (tab.url.indexOf("agah") !== -1) {
    console.log("run");

    const cookies = await getCookies(tab.url);
    const cookieList = [];
    Object.keys(cookies).forEach((key) => {
      const value = cookies[key];
      cookieList.push(`${key}=${value}`);
    });
    const cookieString = cookieList.join(";");

    const userInfo = await getAgahVariables(tab);

    const data = JSON.stringify({
      cookie: cookieString,
      agahUsername: userInfo.Username,
      userName: userInfo.CustomerId,
      userTitle: userInfo.Title,
      broker: "agah",
    });

    // sendRequest("/agah/set-token", data);
    sendRequest("/user/token", data, "PUT");
  } else if (
    tab.url.indexOf("rahbord") !== -1 ||
    tab.url.indexOf("mehr") !== -1 ||
    tab.url.indexOf("sepehr") !== -1 ||
    tab.url.indexOf("abco") !== -1 ||
    tab.url.indexOf("parsian") !== -1 ||
    tab.url.indexOf("seavolex") !== -1 ||
    tab.url.indexOf("atisaz") !== -1 ||
    tab.url.indexOf("ebb") !== -1 ||
    tab.url.indexOf("arzeshafarin") !== -1 ||
    tab.url.indexOf("kbc") !== -1 ||
    tab.url.indexOf("agribourse") !== -1 ||
    tab.url.indexOf("kian") !== -1 ||
    tab.url.indexOf("ck.") !== -1 ||
    tab.url.indexOf("mec.") !== -1 ||
    tab.url.indexOf("sabatamin") !== -1
  ) {
    console.log("run");

    const cookies = await getCookies(tab.url);
    const cookieList = [];
    Object.keys(cookies).forEach((key) => {
      const value = cookies[key];
      cookieList.push(`${key}=${value}`);
    });
    const cookieString = cookieList.join(";");

    const username = await getLocalStorage(tab, "username");
    const userData = await getLocalStorage(tab, "userData");

    let broker = "rahbord";
    if (tab.url.indexOf("rahbord") !== -1) {
      broker = "rahbord";
    } else if (tab.url.indexOf("mehr") !== -1) {
      broker = "mehrafarin";
    } else if (tab.url.indexOf("sepehr") !== -1) {
      broker = "sepehr";
    } else if (tab.url.indexOf("abco") !== -1) {
      broker = "sahmeashna";
    } else if (tab.url.indexOf("parsian") !== -1) {
      broker = "parsian";
    } else if (tab.url.indexOf("seavolex") !== -1) {
      broker = "seavolex";
    } else if (tab.url.indexOf("atisaz") !== -1) {
      broker = "atisaz";
    } else if (tab.url.indexOf("ebb") !== -1) {
      broker = "eghtesadebidar";
    } else if (tab.url.indexOf("arzeshafarin") !== -1) {
      broker = "arzeshafarin";
    } else if (tab.url.indexOf("kbc") !== -1) {
      broker = "karamad";
    } else if (tab.url.indexOf("agribourse") !== -1) {
      broker = "keshavarzi";
    } else if (tab.url.indexOf("kian") !== -1) {
      broker = "kian";
    } else if (tab.url.indexOf("ck.") !== -1) {
      broker = "sarmayehdanesh";
    } else if (tab.url.indexOf("mec.") !== -1) {
      broker = "khavarmianeh";
    } else if (tab.url.indexOf("sabatamin") !== -1) {
      broker = "sabatamin";
    }

    const data = JSON.stringify({
      cookie: cookieString,
      customerTitle: `${userData.firstName} ${userData.lastName}`,
      userName: username,
      broker,
    });

    // sendRequest("/exir/set-token", data);
    sendRequest("/user/token", data, "PUT");
  } else if (tab.url.indexOf("farabixo") !== -1) {
    console.log("run");

    const cookies = await getCookies(tab.url);
    const cookieList = [];
    Object.keys(cookies).forEach((key) => {
      const value = cookies[key];
      cookieList.push(`${key}=${value}`);
    });
    const cookieString = cookieList.join(";");

    const userInfo = await getFarabixoVariables(tab);

    const data = JSON.stringify({
      broker: "farabi",
      cookie: cookieString,
      ...userInfo,
    });

    sendRequest("/user/token", data, "PUT");
  } else if (tab.url.indexOf("nahayatnegar") !== -1) {
    console.log("run");

    const cookies = await getCookies(tab.url);
    const cookieList = [];
    Object.keys(cookies).forEach((key) => {
      const value = cookies[key];
      cookieList.push(`${key}=${value}`);
    });
    const cookieString = cookieList.join(";");

    const userInfo = await getNahayatVariables(tab);

    const data = JSON.stringify({
      broker: "nahayatnegar",
      cookie: cookieString,
      ...userInfo,
    });

    sendRequest("/user/token", data, "PUT");
  }
});

const sendRequest = (url, data, method = "POST") => {
  newApiUrl.forEach((apiDomain) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        console.log("responseText", apiDomain, this.responseText);
      }
    });

    xhr.open(method, `${apiDomain}${url}`);
    xhr.setRequestHeader("content-type", "application/json");
    xhr.setRequestHeader(
      "authorization",
      "Bearer J3bHCcCBf0oh3UPC3zkUFvkcjdJgASDKnLXOi947jy9HyIekgIdqofpXNhIvLRUY"
    );

    xhr.send(data);
  });
};
