```
systemctl status redis
```

```
firewall-cmd --zone=public --permanent --add-port=3000/tcp
firewall-cmd --reload
```

```
pm2 start ~root/projects/bors/api.js --name bors-api --log ~root/projects/bors/log/api
pm2 start bors-api
pm2 stop bors-api
nano ~root/projects/bors/log/api
```

```
pm2 start ~root/projects/bors/setPrice.js --name bors-set-price --log ~root/projects/bors/logs/set-price.logs --cron "0 20 * * *"
pm2 start ~root/projects/bors/setPriceAlternate.js --name bors-set-price-alternate --log ~root/projects/bors/logs/set-price-alternate.logs --cron "0 21 * * *"
```

```
git add .
git commit -m "Add existing file"
git push origin "master"
```

```
kill -9 `lsof -t -i:3000`
```

# SET PROXY

yum install http://rpms.remirepo.net/enterprise/remi-release-7.rpm
yum-config-manager --enable remi-php56
yum install php php-mcrypt php-cli php-curl
php -v

sudo yum install httpd
systemctl start httpd.service
sudo systemctl enable httpd.service
systemctl start httpd.service
sudo systemctl restart httpd.service
cd /var/www/html/

firewall-cmd --zone=public --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

nano /var/www/html/proxy.php

```
<?php
$url = $_GET['url'];

if($_SERVER["REQUEST_METHOD"] == 'POST') {
	$url = $_REQUEST['url'];
}

$ch = curl_init();
curl_setopt ($ch, CURLOPT_URL, $url);
curl_setopt ($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
curl_setopt ($ch, CURLOPT_HEADER, false);
curl_setopt ($ch, CURLOPT_HTTPHEADER, ['authorization: Bearer J3bHCcCBf0oh3UPC3zkUFvkcjdJgASDKnLXOi947jy9HyIekgIdqofpXNhIvLRUY', 'Content-Type:application/json']);
curl_setopt ($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt ($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt ($ch, CURLOPT_TIMEOUT, 10);
curl_setopt ($ch, CURLOPT_MAXREDIRS, 5);

if($_SERVER["REQUEST_METHOD"] == 'POST') {
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents("php://input"));
}

$response = curl_exec($ch);
$err = curl_error($ch);

if($err) die($err);

curl_close($ch);
echo $response;
```

sudo setsebool httpd_can_network_connect 1
