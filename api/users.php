<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';
require __DIR__ . '/../config.php';

function jsonOk(array $data = []): void
{
    echo json_encode(array_merge(['status' => true, 'error' => null], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonErr(int $code, string $message): void
{
    echo json_encode([
        'status' => false,
        'error'  => ['code' => $code, 'message' => $message]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function getUserById($pdo, $id)
{
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

if ($action === '') {
    jsonErr(400, 'No action specified');
}

switch ($action) {
    case 'list': {
            $stmt = $pdo->query("SELECT id, name_first, name_last, status, role FROM users ORDER BY id ASC");
            $users = $stmt->fetchAll();

            foreach ($users as &$user) {
                $user['role_text'] = $ROLE_MAP[$user['role']] ?? 'User';
            }

            jsonOk(['users' => $users]);
            break;
        }

    case 'get': {
            if (!isset($_GET['id'])) {
                jsonErr(101, 'Missing id');
            }
            $id = (int)$_GET['id'];
            if ($id <= 0) jsonErr(101, 'Invalid id');

            $stmt = $pdo->prepare("SELECT id, name_first, name_last, status, role FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch();

            if (!$user) jsonErr(100, 'not found user');

            $user['role_text'] = $ROLE_MAP[$user['role']] ?? 'User';

            jsonOk(['user' => $user]);
            break;
        }

    case 'create': {
            if (!isset($_POST['name_first'])) {
                jsonErr(102, 'Missing name_first');
            }
            if (!isset($_POST['name_last'])) {
                jsonErr(102, 'Missing name_last');
            }
            if (!isset($_POST['role'])) {
                jsonErr(102, 'Missing role');
            }
            $first  = trim($_POST['name_first']);
            $last   = trim($_POST['name_last']);
            $status = isset($_POST['status']) ? (int)$_POST['status'] : 0;
            $role   = (int)$_POST['role'];

            if ($first === '' || $last === '') {
                jsonErr(102, 'Empty name_first or name_last');
            }

            if (!isset($ROLE_MAP[$role])) {
                jsonErr(102, 'Invalid role');
            }

            $stmt = $pdo->prepare("INSERT INTO users (name_first, name_last, status, role) VALUES (?,?,?,?)");
            $stmt->execute([$first, $last, $status, $role]);

            $newId = (int)$pdo->lastInsertId();

            jsonOk([
                'id' => $newId,
                'role_text' => $ROLE_MAP[$role]
            ]);
            break;
        }

    case 'update': {
            if (!isset($_POST['id'])) {
                jsonErr(101, 'Missing id');
            }
            if (!isset($_POST['name_first'])) {
                jsonErr(102, 'Missing name_first');
            }
            if (!isset($_POST['name_last'])) {
                jsonErr(102, 'Missing name_last');
            }
            if (!isset($_POST['role'])) {
                jsonErr(102, 'Missing role');
            }
            $id     = (int)$_POST['id'];
            $first  = trim($_POST['name_first']);
            $last   = trim($_POST['name_last']);
            $status = isset($_POST['status']) ? (int)$_POST['status'] : 0;
            $role   = (int)$_POST['role'];

            if ($id <= 0) jsonErr(101, 'Invalid id');
            if ($first === '' || $last === '') {
                jsonErr(102, 'Validation error: empty or invalid fields');
            }

            if (!isset($ROLE_MAP[$role])) {
                jsonErr(102, 'Invalid role');
            }
            // існування користувача
            $user = getUserById($pdo, $id);
            if (!$user) {
                jsonErr(107, 'User not found for update');
            }

            $stmt = $pdo->prepare("UPDATE users SET name_first=?, name_last=?, status=?, role=? WHERE id=?");
            $stmt->execute([$first, $last, $status, $role, $id]);

            jsonOk([
                'id' => $id,
                'role_text' => $ROLE_MAP[$role]
            ]);
            break;
        }

    case 'validate_ids': {
            //перевірка які ID існують в базі
            if (!isset($_POST['ids']) || !is_array($_POST['ids'])) {
                jsonErr(103, 'Missing or invalid ids');
            }

            $ids = array_map('intval', $_POST['ids']);
            if (empty($ids)) {
                jsonOk(['valid_ids' => []]);
            }

            $placeholders = implode(',', array_fill(0, count($ids), '?'));

            // знайти які ID в базі
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id IN ($placeholders)");
            $stmt->execute($ids);
            $validIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            jsonOk(['valid_ids' => $validIds]);
            break;
        }

    case 'delete': {
            if (!isset($_POST['id'])) {
                jsonErr(101, 'Missing id');
            }

            $id = (int)$_POST['id'];
            if ($id <= 0) jsonErr(101, 'Invalid id');

            $user = getUserById($pdo, $id);
            if (!$user) {
                jsonErr(100, 'User not found');
            }

            $stmt = $pdo->prepare("DELETE FROM users WHERE id=?");
            $stmt->execute([$id]);

            jsonOk(['processed_ids' => [$id]]);
            break;
        }

    case 'bulk': {
            if (!isset($_POST['action_type'])) {
                jsonErr(104, 'Missing action_type');
            }
            if (!isset($_POST['ids']) || !is_array($_POST['ids'])) {
                jsonErr(103, 'Missing or invalid ids');
            }
            $actionType = $_POST['action_type'];
            $ids = array_map('intval', $_POST['ids']);

            if (empty($ids)) {
                jsonOk(['processed_ids' => []]);
            }

            $placeholders = implode(',', array_fill(0, count($ids), '?'));

            $stmt = $pdo->prepare("SELECT id FROM users WHERE id IN ($placeholders)");
            $stmt->execute($ids);
            $existingIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $existingIds = array_map('intval', $existingIds);

            if (empty($existingIds)) {
                jsonOk(['processed_ids' => []]);
            }

            // новий список placeholders тільки для існуючих
            $placeholders2 = implode(',', array_fill(0, count($existingIds), '?'));

            if ($actionType === 'set_active') {
                $stmt = $pdo->prepare("UPDATE users SET status=1 WHERE id IN ($placeholders2)");
                $stmt->execute($existingIds);
            } elseif ($actionType === 'set_not_active') {
                $stmt = $pdo->prepare("UPDATE users SET status=0 WHERE id IN ($placeholders2)");
                $stmt->execute($existingIds);
            } elseif ($actionType === 'delete') {
                $stmt = $pdo->prepare("DELETE FROM users WHERE id IN ($placeholders2)");
                $stmt->execute($existingIds);
            } else {
                jsonErr(104, 'Unknown bulk action');
            }

            //повертати тільки ті ID, що реально оброблені
            jsonOk(['processed_ids' => $existingIds]);
            break;
        }

    default:
        jsonErr(400, 'Unknown action');
}
