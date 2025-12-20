<?php

$host = 'localhost';
// $host = 'sql213.infinityfree.com';

$db   = 'user_manager';
// $db   = 'if0_40714789_users';
$user = 'root';
// $user = 'if0_40714789';
// $pass = '89EJRXAm5bG';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

try {
    $pdo = new PDO($dsn, $user, $pass);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => false,
        'error'  => ['code' => 500, 'message' => 'Database connection error']
    ]);
    exit;
}
