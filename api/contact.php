<?php
declare(strict_types=1);
// PHP 8.1+. Configure mail transport and environment before enabling.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function respond(int $status, string $code): never {
    http_response_code($status);
    echo json_encode(['ok' => $status === 200, 'code' => $code]);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, 'method');
}
if (getenv('COREX_CONTACT_ENABLED') !== '1') respond(503, 'unavailable');
$origins = ['https://corexengineering.kz', 'https://www.corexengineering.kz'];
if (!in_array($_SERVER['HTTP_ORIGIN'] ?? '', $origins, true)) respond(403, 'origin');
if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') respond(415, 'format');
$raw = file_get_contents('php://input', false, null, 0, 16385);
if ($raw === false || strlen($raw) > 16384) respond(413, 'size');
$data = json_decode($raw, true);
if (!is_array($data)) respond(400, 'invalid');
function field(array $data, string $key, int $max, bool $required = false): string {
    $value = $data[$key] ?? '';
    if (!is_string($value) || !preg_match('//u', $value)) respond(422, 'invalid');
    $value = preg_replace('/^\s+|\s+$/u', '', $value);
    if (preg_match_all('/./us', $value) > $max || ($required && $value === '') || str_contains($value, "\0")) respond(422, 'invalid');
    return $value;
}
$name = field($data, 'name', 120, true);
$company = field($data, 'company', 160, true);
$email = field($data, 'email', 254, true);
$task = field($data, 'task', 2000, true);
$language = field($data, 'language', 2, true);
$page = field($data, 'page', 300);
$emailPattern = "~^[a-zA-Z0-9!#$%&'*+/=?^_`{|}\\~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}\\~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$~D";
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match($emailPattern, $email) || strlen(explode('@', $email)[0]) > 64) respond(422, 'invalid');
if (!in_array($language, ['ru', 'en', 'kk'], true)) respond(422, 'invalid');
if (field($data, 'website', 200) !== '') respond(422, 'invalid');
// Shared filesystem lock makes rate limits atomic across PHP workers.
// No message content is stored. Configure this directory outside the web root.
$directory = getenv('COREX_CONTACT_RATE_DIR');
$salt = getenv('COREX_CONTACT_RATE_SALT');
if (!$directory || !$salt || strlen($salt) < 32 || !is_dir($directory) || !is_writable($directory)) respond(503, 'unavailable');
$path = rtrim($directory, '/\\') . '/contact-rate.json';
$handle = @fopen($path, 'c+');
if (!$handle || !flock($handle, LOCK_EX)) respond(503, 'unavailable');
$rates = json_decode(stream_get_contents($handle), true) ?: [];
$now = time();
foreach ($rates as $key => $entry) {
    if (($entry['start'] ?? 0) < $now - 3600) unset($rates[$key]);
}
$ip = hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown', $salt);
$entry = $rates[$ip] ?? ['start' => $now, 'last' => 0, 'count' => 0];
if ($entry['count'] >= 5 || $entry['last'] > $now - 60 || count($rates) > 10000) {
    flock($handle, LOCK_UN); fclose($handle);
    header('Retry-After: 3600'); respond(429, 'rate');
}
$entry['last'] = $now; $entry['count']++; $rates[$ip] = $entry;
$encoded = json_encode($rates);
rewind($handle);
$saved = ftruncate($handle, 0) && fwrite($handle, $encoded) === strlen($encoded) && fflush($handle);
flock($handle, LOCK_UN); fclose($handle);
if (!$saved) respond(503, 'unavailable');
$subject = 'CoreX website enquiry [' . strtoupper($language) . ']';
$body = "Name: $name\nCompany: $company\nReply email: $email\nLanguage: $language\nPage: $page\n\nRequirements:\n$task\n";
$headers = [
    'From' => 'CoreX Engineering <website@corexengineering.kz>',
    'Reply-To' => $email,
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit'
];
// true means the configured mail transport accepted it, not inbox delivery.
if (!function_exists('mail') || !@mail('info@corexengineering.kz', $subject, $body, $headers)) respond(503, 'unavailable');
respond(200, 'accepted');
