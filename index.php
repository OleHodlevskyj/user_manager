<?php
require __DIR__ . '/api/db.php';
require __DIR__ . '/config.php';

$stmt = $pdo->query("SELECT id, name_first, name_last, status, role FROM users ORDER BY id ASC");
$users = $stmt->fetchAll();

require __DIR__ . '/includes/header.php';
?>

<div class="container">
    <h1 class="mb-4">User Management</h1>

    <!-- Top Controls -->
    <div class="d-flex justify-content-between align-items-center mb-3">
        <button class="btn btn-primary" id="btnAddUser">Add</button>

        <div class="d-flex gap-2">
            <select class="form-select" id="bulkAction" style="width: 220px;">
                <option value="">Please Select</option>
                <option value="set_active">Set active</option>
                <option value="set_not_active">Set not active</option>
                <option value="delete">Delete</option>
            </select>
            <button class="btn btn-secondary" id="btnBulkOk">OK</button>
        </div>
    </div>

    <!-- Table -->
    <table class="table table-striped align-middle" id="usersTable">
        <thead>
            <tr>
                <th scope="col"><input type="checkbox" id="checkAll"></th>
                <th scope="col">Name</th>
                <th scope="col">Status</th>
                <th scope="col">Role</th>
                <th scope="col">Options</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($users as $u): ?>
                <tr data-id="<?= htmlspecialchars($u['id']) ?>">
                    <td><input type="checkbox" class="row-check"></td>
                    <td><?= htmlspecialchars($u['name_first']) ?> <?= htmlspecialchars($u['name_last']) ?></td>
                    <td>
                        <span class="status-dot <?= $u['status'] ? 'bg-success' : 'bg-secondary' ?>"></span>
                    </td>
                    <td><?= htmlspecialchars($ROLE_MAP[$u['role']] ?? 'User') ?></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary btn-edit" type="button" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-delete" type="button" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <!-- Bottom Controls -->
    <div class="d-flex justify-content-between align-items-center mt-3">
        <button class="btn btn-primary" id="btnAddUserBottom">Add</button>

        <div class="d-flex gap-2">
            <select class="form-select" id="bulkActionBottom" style="width: 220px;">
                <option value="">Please Select</option>
                <option value="set_active">Set active</option>
                <option value="set_not_active">Set not active</option>
                <option value="delete">Delete</option>
            </select>
            <button class="btn btn-secondary" id="btnBulkOkBottom">OK</button>
        </div>
    </div>
</div>

<?php
require __DIR__ . '/includes/modals.php';
require __DIR__ . '/includes/footer.php';
?>
