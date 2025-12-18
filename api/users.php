<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';

function jsonOk(array $data = []): void {
    echo json_encode(array_merge(['status' => true, 'error' => null], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonErr(int $code, string $message): void {
    echo json_encode([
        'status' => false,
        'error'  => ['code' => $code, 'message' => $message]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

if ($action === '') {
    jsonErr(400, 'No action specified');
}

switch ($action) {
    case 'list': {
        $stmt = $pdo->query("SELECT id, name_first, name_last, status, role FROM users ORDER BY id DESC");
        $users = $stmt->fetchAll();
        jsonOk(['users' => $users]);
        break;
    }

    case 'get': {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) jsonErr(101, 'Invalid id');

        $stmt = $pdo->prepare("SELECT id, name_first, name_last, status, role FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) jsonErr(100, 'not found user');
        jsonOk(['user' => $user]);
        break;
    }

    case 'create': {
        $first  = trim($_POST['name_first'] ?? '');
        $last   = trim($_POST['name_last'] ?? '');
        $status = isset($_POST['status']) ? (int)$_POST['status'] : 0;
        $role   = $_POST['role'] ?? 'user';

        if ($first === '' || $last === '' || !in_array($role, ['admin', 'user'], true)) {
            jsonErr(102, 'Validation error: empty or invalid fields');
        }

        $stmt = $pdo->prepare("INSERT INTO users (name_first, name_last, status, role) VALUES (?,?,?,?)");
        $stmt->execute([$first, $last, $status, $role]);

        jsonOk(['id' => (int)$pdo->lastInsertId()]);
        break;
    }

    case 'update': {
        $id     = (int)($_POST['id'] ?? 0);
        $first  = trim($_POST['name_first'] ?? '');
        $last   = trim($_POST['name_last'] ?? '');
        $status = isset($_POST['status']) ? (int)$_POST['status'] : 0;
        $role   = $_POST['role'] ?? 'user';

        if ($id <= 0) jsonErr(101, 'Invalid id');
        if ($first === '' || $last === '' || !in_array($role, ['admin', 'user'], true)) {
            jsonErr(102, 'Validation error: empty or invalid fields');
        }

        $stmt = $pdo->prepare("UPDATE users SET name_first=?, name_last=?, status=?, role=? WHERE id=?");
        $stmt->execute([$first, $last, $status, $role, $id]);

        jsonOk(['id' => $id]);
        break;
    }

    case 'delete': {
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) jsonErr(101, 'Invalid id');

        $stmt = $pdo->prepare("DELETE FROM users WHERE id=?");
        $stmt->execute([$id]);

        jsonOk(['id' => $id]);
        break;
    }

    case 'bulk': {
        $actionType = $_POST['action_type'] ?? '';
        $ids = $_POST['ids'] ?? [];

        if (!is_array($ids) || count($ids) === 0) jsonErr(103, 'No ids');
        $ids = array_map('intval', $ids);

        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        if ($actionType === 'set_active') {
            $stmt = $pdo->prepare("UPDATE users SET status=1 WHERE id IN ($placeholders)");
            $stmt->execute($ids);
        } elseif ($actionType === 'set_not_active') {
            $stmt = $pdo->prepare("UPDATE users SET status=0 WHERE id IN ($placeholders)");
            $stmt->execute($ids);
        } elseif ($actionType === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id IN ($placeholders)");
            $stmt->execute($ids);
        } else {
            jsonErr(104, 'Unknown bulk action');
        }

        jsonOk();

        break;
        
    }

    default:
        jsonErr(400, 'Unknown action');
}
