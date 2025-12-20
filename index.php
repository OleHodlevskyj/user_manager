<?php
require __DIR__ . '/api/db.php';

$stmt = $pdo->query("SELECT id, name_first, name_last, status, role FROM users ORDER BY id DESC");
$users = $stmt->fetchAll();
?>


<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>User Manager</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"
        crossorigin="anonymous">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>

<body class="p-4">
    <div class="container">
        <h1 class="mb-4">User Management</h1>

        <!-- Top -->
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
                        <td><?= htmlspecialchars($u['role']) ?></td>
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

        <!-- Bottom -->
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

    <!-- Add/Edit modal -->
    <div class="modal fade" id="userModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <form id="userForm" class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="userModalTitle">Add user</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">
                    <input type="hidden" id="userId">

                    <div class="mb-3">
                        <label class="form-label">First Name</label>
                        <input type="text" class="form-control" id="firstName">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Last Name</label>
                        <input type="text" class="form-control" id="lastName">
                    </div>

                    <div class="mb-3">
                        <label class="form-label d-block">Status</label>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="statusSwitch" checked>
                            <label class="form-check-label" for="statusSwitch">Active</label>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Role</label>
                        <select class="form-select" id="role">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Confirm delete -->
    <div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Confirm delete</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    Are you sure you want to delete user <strong id="deleteUserName"></strong>?
                    <input type="hidden" id="deleteUserId">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Warning modal -->
    <div class="modal fade" id="warningNoUsersModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Warning</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">No users selected.</div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="warningNoActionModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Warning</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">No action selected.</div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Confirm bulk delete -->
    <div class="modal fade" id="confirmBulkDeleteModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Confirm bulk delete</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    Are you sure you want to delete selected users?
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmBulkDeleteBtn">Delete</button>
                </div>
            </div>
        </div>
    </div>



    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/app.js"></script>

</body>

</html>