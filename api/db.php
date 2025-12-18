<?php

$host = 'localhost';
$db   = 'user_manager';
$user = 'root';
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
