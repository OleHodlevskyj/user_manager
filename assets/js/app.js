$(function () {
  const userModal = new bootstrap.Modal(document.getElementById('userModal'));
  const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
  const warningNoUsersModal = new bootstrap.Modal(document.getElementById('warningNoUsersModal'));
  const warningNoActionModal = new bootstrap.Modal(document.getElementById('warningNoActionModal'));

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function loadUsers() {
    $.getJSON('api/users.php', { action: 'list' })
      .done(function (res) {
        if (!res || !res.status) return;

        const tbody = $('#usersTable tbody');
        tbody.empty();

        (res.users || []).forEach(function (u) {
          const statusDot = `<span class="status-dot ${Number(u.status) ? 'bg-success' : 'bg-secondary'}"></span>`;
          tbody.append(`
            <tr data-id="${u.id}">
              <td><input type="checkbox" class="row-check"></td>
              <td>${escapeHtml(u.name_first)} ${escapeHtml(u.name_last)}</td>
              <td>${statusDot}</td>
              <td>${escapeHtml(u.role)}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary btn-edit" type="button" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete" type="button" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `);
        });

        $('#checkAll').prop('checked', false);
      })
      .fail(function (xhr) {
        console.log('loadUsers FAIL:', xhr.status, xhr.responseText);
      });
  }

  loadUsers();

  // Select all
  $('#checkAll').off('change').on('change', function () {
    const checked = $(this).is(':checked');
    $('#usersTable tbody .row-check').prop('checked', checked);
  });

  $('#usersTable').off('change', '.row-check').on('change', '.row-check', function () {
    const total = $('#usersTable tbody .row-check').length;
    const checked = $('#usersTable tbody .row-check:checked').length;
    $('#checkAll').prop('checked', total > 0 && total === checked);
  });

  function openAddModal() {
    $('#userModalTitle').text('Add user');
    $('#userId').val('');
    $('#firstName').val('');
    $('#lastName').val('');
    $('#statusSwitch').prop('checked', true);
    $('#role').val('user');
    userModal.show();
  }

  $('#btnAddUser, #btnAddUserBottom').off('click').on('click', openAddModal);

  // Edit
  $('#usersTable').off('click', '.btn-edit').on('click', '.btn-edit', function () {
    const id = $(this).closest('tr').data('id');

    $.getJSON('api/users.php', { action: 'get', id })
      .done(function (res) {
        if (!res || !res.status) return;

        const u = res.user;
        $('#userModalTitle').text('Edit user');
        $('#userId').val(u.id);
        $('#firstName').val(u.name_first);
        $('#lastName').val(u.name_last);
        $('#statusSwitch').prop('checked', !!Number(u.status));
        $('#role').val(u.role);
        userModal.show();
      })
      .fail(function (xhr) {
        console.log('get FAIL:', xhr.status, xhr.responseText);
      });
  });

  $('#userForm').off('submit').on('submit', function (e) {
    e.preventDefault();

    const payload = {
      action: $('#userId').val() ? 'update' : 'create',
      id: $('#userId').val(),
      name_first: $('#firstName').val().trim(),
      name_last: $('#lastName').val().trim(),
      status: $('#statusSwitch').is(':checked') ? 1 : 0,
      role: $('#role').val()
    };

    const $saveBtn = $('#userForm button[type="submit"]');
    $saveBtn.prop('disabled', true);

    $.ajax({
      url: 'api/users.php',
      method: 'POST',
      data: payload,
      dataType: 'json'
    })
      .done(function (res) {
        if (!res || !res.status) {
          alert(res?.error?.message || 'Error');
          return;
        }
        userModal.hide();
        loadUsers();
      })
      .fail(function (xhr) {
        console.log('save FAIL:', xhr.status, xhr.responseText);
        alert('Request failed. Check console (F12).');
      })
      .always(function () {
        $saveBtn.prop('disabled', false);
      });
  });

  let deleteId = null;

  $('#usersTable').off('click', '.btn-delete').on('click', '.btn-delete', function () {
    deleteId = $(this).closest('tr').data('id');
    $('#deleteUserId').val(deleteId);
    confirmDeleteModal.show();
  });

  $('#confirmDeleteBtn').off('click').on('click', function () {
    if (!deleteId) return;

    $.ajax({
      url: 'api/users.php?action=delete',
      method: 'POST',
      data: { id: deleteId },
      dataType: 'json'
    })
      .done(function (res) {
        if (!res || !res.status) {
          alert(res?.error?.message || 'Error');
          return;
        }
        confirmDeleteModal.hide();
        deleteId = null;
        loadUsers();
      })
      .fail(function (xhr) {
        console.log('delete FAIL:', xhr.status, xhr.responseText);
      });
  });

  function runBulk(selectId) {
    const actionType = $(selectId).val();
    const ids = $('#usersTable tbody .row-check:checked')
      .map(function () { return $(this).closest('tr').data('id'); })
      .get();

    if (!ids.length) {
      warningNoUsersModal.show();
      return;
    }
    if (!actionType) {
      warningNoActionModal.show();
      return;
    }
    $.ajax({
      url: 'api/users.php?action=bulk',
      method: 'POST',
      data: { action_type: actionType, ids: ids },
      dataType: 'json'
    })
      .done(function (res) {
        if (!res || !res.status) {
          alert(res?.error?.message || 'Error');
          return;
        }
        $(selectId).val('');
        loadUsers();
      })
      .fail(function (xhr) {
        console.log('bulk FAIL:', xhr.status, xhr.responseText);
      });
  }

  $('#btnBulkOk').off('click').on('click', function () { runBulk('#bulkAction'); });
  $('#btnBulkOkBottom').off('click').on('click', function () { runBulk('#bulkActionBottom'); });
});
