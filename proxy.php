<?php
$url = $_GET['url'];
$withCookie = $_GET['cookie'];
$setCookie = $_GET['set-cookie'];

if($_SERVER["REQUEST_METHOD"] == 'POST') {
	$url = $_REQUEST['url'];
}

$httpHeader = [
	'authorization: Bearer J3bHCcCBf0oh3UPC3zkUFvkcjdJgASDKnLXOi947jy9HyIekgIdqofpXNhIvLRUY',
	'Content-Type: application/json'
];

/*$headers = apache_request_headers();
if($headers AND $headers->Cookie) {
	$httpHeader[] = "Cookie: $headers->Cookie";
}*/

$ch = curl_init();
curl_setopt ($ch, CURLOPT_URL, $url);
curl_setopt ($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
curl_setopt ($ch, CURLOPT_HTTPHEADER, $httpHeader);
curl_setopt ($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt ($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt ($ch, CURLOPT_TIMEOUT, 10);
curl_setopt ($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt ($ch, CURLOPT_HEADER, $withCookie === '1' ? true : false);

if($_SERVER["REQUEST_METHOD"] == 'POST') {
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents("php://input"));
}

$response = curl_exec($ch);
$err = curl_error($ch);
		
if($err) die($err);
	
curl_close($ch);

if($withCookie === '1') {
        preg_match_all('/^set-cookie:\s*([^;]*)/mi', $response, $matches);
        foreach($matches[1] as $item) {
		list($key, $value) = explode("=", $item);
		setcookie($key, $value);
        }
}

echo $response;
