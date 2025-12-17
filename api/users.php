<?php
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? null);

function errorResponse($code, $message)
{
    echo json_encode([
        'status' => false,
        'error'  => ['code' => $code, 'message' => $message]
    ]);
    exit;
}

if (!$action) {
    errorResponse(400, 'No action specified');
}

switch ($action) {

    case 'list':
        $stmt = $pdo->query("SELECT id, name_first, name_last, status, role FROM users ORDER BY id DESC");
        $users = $stmt->fetchAll();
        echo json_encode([
            'status' => true,
            'error'  => null,
            'users'  => $users
        ]);
        break;

    case 'get':
        $id = intval($_GET['id'] ?? 0);
        if (!$id) {
            errorResponse(101, 'Invalid id');
        }
        $stmt = $pdo->prepare("SELECT id, name_first, name_last, status, role FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user) {
            errorResponse(100, 'not found user');
        }
        echo json_encode([
            'status' => true,
            'error'  => null,
            'user'   => $user
        ]);
        break;

    case 'create':
        $first  = trim($_POST['name_first'] ?? '');
        $last   = trim($_POST['name_last'] ?? '');
        $status = isset($_POST['status']) ? (int)$_POST['status'] : 0;
        $role   = $_POST['role'] ?? 'user';

        if ($first === '' || $last === '' || !in_array($role, ['admin', 'user'], true)) {
            errorResponse(102, 'Validation error: empty or invalid fields');
        }

        $stmt = $pdo->prepare("INSERT INTO users (name_first, name_last, status, role) VALUES (?,?,?,?)");
        $stmt->execute([$first, $last, $status, $role]);
        $id = (int)$pdo->lastInsertId();

        echo json_encode([
            'status' => true,
            'error'  => null,
            'id'     => $id
        ]);
        break;

    case 'update':
        $id     = intval($_POST['id'] ?? 0);
        $first  = trim($_POST['name_first'] ?? '');
        $last   = trim($_POST['name_last'] ?? '');
        $status = isset($_POST['status']) ? (int)$_POST['status'] : 0;
        $role   = $_POST['role'] ?? 'user';

        if (!$id) {
            errorResponse(101, 'Invalid id');
        }
        if ($first === '' || $last === '' || !in_array($role, ['admin', 'user'], true)) {
            errorResponse(102, 'Validation error: empty or invalid fields');
        }

        $stmt = $pdo->prepare("UPDATE users SET name_first = ?, name_last = ?, status = ?, role = ? WHERE id = ?");
        $stmt->execute([$first, $last, $status, $role, $id]);

        echo json_encode([
            'status' => true,
            'error'  => null,
            'id'     => $id
        ]);
        break;

    case 'delete':
        $id = intval($_POST['id'] ?? 0);
        if (!$id) {
            errorResponse(101, 'Invalid id');
        }
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode([
            'status' => true,
            'error'  => null,
            'id'     => $id
        ]);
        break;

    case 'bulk':
        $actionType = $_POST['action_type'] ?? '';
        $ids        = $_POST['ids'] ?? [];

        if (!is_array($ids) || !count($ids)) {
            errorResponse(103, 'No ids');
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        if ($actionType === 'set_active') {
            $stmt = $pdo->prepare("UPDATE users SET status = 1 WHERE id IN ($placeholders)");
            $stmt->execute($ids);
        } elseif ($actionType === 'set_not_active') {
            $stmt = $pdo->prepare("UPDATE users SET status = 0 WHERE id IN ($placeholders)");
            $stmt->execute($ids);
        } elseif ($actionType === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id IN ($placeholders)");
            $stmt->execute($ids);
        } else {
            errorResponse(104, 'Unknown bulk action');
        }

        echo json_encode([
            'status' => true,
            'error'  => null
        ]);
        break;

    default:
        errorResponse(400, 'Unknown action');
}
