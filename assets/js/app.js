$(function () {
  const userModal = new bootstrap.Modal(document.getElementById("userModal"));
  const confirmDeleteModal = new bootstrap.Modal(
    document.getElementById("confirmDeleteModal")
  );
  const warningNoUsersModal = new bootstrap.Modal(
    document.getElementById("warningNoUsersModal")
  );
  const warningNoActionModal = new bootstrap.Modal(
    document.getElementById("warningNoActionModal")
  );
  const confirmBulkDeleteModal = new bootstrap.Modal(
    document.getElementById("confirmBulkDeleteModal")
  );

  console.log("All modals initialized");

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function prependUserRow(u) {
    const statusDot = `<span class="status-dot ${
      Number(u.status) ? "bg-success" : "bg-secondary"
    }"></span>`;

    const row = `
      <tr data-id="${u.id}">
        <td><input type="checkbox" class="row-check"></td>
        <td>${escapeHtml(u.name_first)} ${escapeHtml(u.name_last)}</td>
        <td>${statusDot}</td>
        <td>${escapeHtml(u.role_text)}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary btn-edit" type="button" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger btn-delete" type="button" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;

    $("#usersTable tbody").prepend(row);
  }

  function updateUserRow(userId, data) {
    const row = $(`#usersTable tbody tr[data-id="${userId}"]`);
    if (!row.length) {
      console.log("Row not found for userId:", userId);
      return;
    }

    console.log("Updating row with data:", data);

    const statusDot = `<span class="status-dot ${
      Number(data.status) ? "bg-success" : "bg-secondary"
    }"></span>`;

    row.find("td:eq(1)").text(`${data.name_first} ${data.name_last}`);
    row.find("td:eq(2)").html(statusDot);
    row.find("td:eq(3)").text(data.role_text);

    console.log("Row updated, new status dot:", statusDot);
  }

  function loadUsers() {
    $.getJSON("api/users.php", { action: "list" })
      .done(function (res) {
        console.log("loadUsers response:", res);

        if (!res || !res.status) return;

        const tbody = $("#usersTable tbody");
        tbody.empty();

        (res.users || []).forEach(function (u) {
          const statusDot = `<span class="status-dot ${
            Number(u.status) ? "bg-success" : "bg-secondary"
          }"></span>`;
          tbody.append(`
            <tr data-id="${u.id}">
              <td><input type="checkbox" class="row-check"></td>
              <td>${escapeHtml(u.name_first)} ${escapeHtml(u.name_last)}</td>
              <td>${statusDot}</td>
              <td>${escapeHtml(u.role_text || "User")}</td>
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

        $("#checkAll").prop("checked", false);
      })
      .fail(function (xhr) {
        console.log("loadUsers FAIL:", xhr.status, xhr.responseText);
      });
  }

  // Select all
  $("#checkAll")
    .off("change")
    .on("change", function () {
      const checked = $(this).is(":checked");
      $("#usersTable tbody .row-check").prop("checked", checked);
    });

  $("#usersTable").on("change", ".row-check", function () {
    const total = $("#usersTable tbody .row-check").length;
    const checked = $("#usersTable tbody .row-check:checked").length;
    $("#checkAll").prop("checked", total > 0 && total === checked);
    console.log("Row check changed. Total:", total, "Checked:", checked);
  });

  function clearValidation() {
    $("#firstName, #lastName").removeClass("is-invalid");
    $(".invalid-feedback").remove();
  }

  function validateForm() {
    clearValidation();
    let isValid = true;

    const firstName = $("#firstName").val().trim();
    const lastName = $("#lastName").val().trim();

    if (!firstName) {
      $("#firstName")
        .addClass("is-invalid")
        .after('<div class="invalid-feedback">Please enter first name</div>');
      isValid = false;
    }

    if (!lastName) {
      $("#lastName")
        .addClass("is-invalid")
        .after('<div class="invalid-feedback">Please enter last name</div>');
      isValid = false;
    }

    return isValid;
  }

  $("#firstName").on("input", function () {
    if ($(this).val().trim() !== "") {
      $(this).removeClass("is-invalid");
      $(this).next(".invalid-feedback").remove();
    }
  });

  $("#lastName").on("input", function () {
    if ($(this).val().trim() !== "") {
      $(this).removeClass("is-invalid");
      $(this).next(".invalid-feedback").remove();
    }
  });

  function openAddModal() {
    $("#userModalTitle").text("Add user");
    $("#userId").val("");
    $("#firstName").val("");
    $("#lastName").val("");
    $("#statusSwitch").prop("checked", true);
    $("#role").val("2");
    clearValidation();
    userModal.show();
  }

  $("#btnAddUser, #btnAddUserBottom").off("click").on("click", openAddModal);

  // Edit
  $("#usersTable")
    .off("click", ".btn-edit")
    .on("click", ".btn-edit", function () {
      const id = $(this).closest("tr").data("id");

      $.getJSON("api/users.php", { action: "get", id })
        .done(function (res) {
          if (!res || !res.status) return;

          const u = res.user;
          $("#userModalTitle").text("Edit user");
          $("#userId").val(u.id);
          $("#firstName").val(u.name_first);
          $("#lastName").val(u.name_last);
          $("#statusSwitch").prop("checked", !!Number(u.status));
          $("#role").val(String(u.role));
          clearValidation();
          userModal.show();
        })
        .fail(function (xhr) {
          console.log("get FAIL:", xhr.status, xhr.responseText);
        });
    });

  $("#userForm")
    .off("submit")
    .on("submit", function (e) {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const roleText = $("#role option:selected").text();

      const currentStatus = $("#statusSwitch").is(":checked") ? 1 : 0;

      const payload = {
        action: $("#userId").val() ? "update" : "create",
        id: $("#userId").val(),
        name_first: $("#firstName").val().trim(),
        name_last: $("#lastName").val().trim(),
        status: currentStatus,
        role: $("#role").val(),
      };

      console.log("Submitting payload:", payload);

      const $saveBtn = $('#userForm button[type="submit"]');
      $saveBtn.prop("disabled", true);

      $.ajax({
        url: "api/users.php",
        method: "POST",
        data: payload,
        dataType: "json",
      })
        .done(function (res) {
          if (!res || !res.status) {
            alert(res?.error?.message || "Error");
            return;
          }

          console.log("Save successful, response:", res);

          userModal.hide();

          if (payload.action === "create") {
            const newUser = {
              id: res.id,
              name_first: payload.name_first,
              name_last: payload.name_last,
              status: payload.status,
              role_text: roleText,
            };
            prependUserRow(newUser);
          } else {
            console.log("Updating row with status:", payload.status);
            updateUserRow(payload.id, {
              name_first: payload.name_first,
              name_last: payload.name_last,
              status: payload.status,
              role_text: roleText,
            });
          }
        })
        .fail(function (xhr) {
          console.log("save FAIL:", xhr.status, xhr.responseText);
          alert("Request failed. Check console (F12).");
        })
        .always(function () {
          $saveBtn.prop("disabled", false);
        });
    });

  let deleteId = null;

  // Single delete
  $("#usersTable").on("click", ".btn-delete", function () {
    const row = $(this).closest("tr");
    deleteId = row.data("id");

    const userName = row.find("td:eq(1)").text().trim();

    $("#deleteUserId").val(deleteId);
    $("#deleteUserName").text(userName);

    confirmDeleteModal.show();
  });

  $("#confirmDeleteBtn").on("click", function () {
    if (!deleteId) return;

    const userIdToDelete = deleteId;

    console.log("Confirming delete for user ID:", deleteId);

    $.ajax({
      url: "api/users.php?action=delete",
      method: "POST",
      data: { id: deleteId },
      dataType: "json",
    })
      .done(function (res) {
        if (!res || !res.status) {
          alert(res?.error?.message || "Error");
          return;
        }
        confirmDeleteModal.hide();
        deleteId = null;

        $(`#usersTable tbody tr[data-id="${userIdToDelete}"]`).remove();
      })
      .fail(function (xhr) {
        console.log("delete FAIL:", xhr.status, xhr.responseText);
      });
  });

  function runBulk(selectId) {
    const actionType = $(selectId).val();
    const ids = $("#usersTable tbody .row-check:checked")
      .map(function () {
        return $(this).closest("tr").data("id");
      })
      .get();

    console.log("runBulk called", { selectId, actionType, ids });

    if (!ids.length) {
      console.log("No users selected - showing warning");
      warningNoUsersModal.show();
      return;
    }
    if (!actionType) {
      console.log("No action selected - showing warning");
      warningNoActionModal.show();
      return;
    }

    if (actionType !== "delete") {
      console.log("runBulk: non-delete action, calling doBulkRequest");
      doBulkRequest(actionType, ids, selectId);
      return;
    }

    console.log("runBulk: preparing bulk delete confirmation");

    $("#confirmBulkDeleteBtn").data("bulk-ids", ids);
    $("#confirmBulkDeleteBtn").data("bulk-select", selectId);
    $("#confirmBulkDeleteBtn").data("bulk-action", actionType);

    console.log("runBulk: showing confirmBulkDeleteModal");

    confirmBulkDeleteModal.show();

    console.log("confirmBulkDeleteModal.show() called");
  }

  function doBulkRequest(actionType, ids, selectId) {
    console.log("doBulkRequest called", { actionType, ids, selectId });

    $.ajax({
      url: "api/users.php?action=bulk",
      method: "POST",
      data: { action_type: actionType, ids: ids },
      dataType: "json",
    })
      .done(function (res) {
        if (!res || !res.status) {
          alert(res?.error?.message || "Error");
          return;
        }
        $(selectId).val("");

        if (actionType === "delete") {
          ids.forEach(function (id) {
            $(`#usersTable tbody tr[data-id="${id}"]`).remove();
          });
        } else if (actionType === "set_active") {
          ids.forEach(function (id) {
            const row = $(`#usersTable tbody tr[data-id="${id}"]`);
            row
              .find("td:eq(2)")
              .html('<span class="status-dot bg-success"></span>');
          });
        } else if (actionType === "set_not_active") {
          ids.forEach(function (id) {
            const row = $(`#usersTable tbody tr[data-id="${id}"]`);
            row
              .find("td:eq(2)")
              .html('<span class="status-dot bg-secondary"></span>');
          });
        }

        $("#usersTable tbody .row-check:checked").prop("checked", false);
        $("#checkAll").prop("checked", false);
      })
      .fail(function (xhr) {
        console.log("bulk FAIL:", xhr.status, xhr.responseText);
      });
  }

  $("#confirmBulkDeleteBtn").on("click", function () {
    const ids = $(this).data("bulk-ids") || [];
    const selectId = $(this).data("bulk-select");
    const actionType = $(this).data("bulk-action") || "delete";

    console.log("Bulk delete confirmed", { ids, selectId, actionType });

    if (!ids.length || !selectId) {
      confirmBulkDeleteModal.hide();
      return;
    }

    confirmBulkDeleteModal.hide();
    doBulkRequest(actionType, ids, selectId);
  });

  console.log("Attaching bulk OK handlers with delegation...");

  $(document).on("click", "#btnBulkOk", function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("Top OK button clicked via delegation", e);
    runBulk("#bulkAction");
  });

  $(document).on("click", "#btnBulkOkBottom", function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("Bottom OK button clicked via delegation", e);
    runBulk("#bulkActionBottom");
  });

  console.log("All event handlers attached");
});