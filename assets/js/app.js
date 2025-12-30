$(function () {
  const userModal = new bootstrap.Modal(document.getElementById("userModal"));
  const infoModal = new bootstrap.Modal(document.getElementById("infoModal"));
  const confirmModal = new bootstrap.Modal(
    document.getElementById("confirmModal")
  );

  function showInfoModal(message, title = "Message") {
    $("#infoModalTitle").text(title);
    $("#infoModalBody").text(message);
    infoModal.show();
  }

  function showConfirmModal(title, message, onConfirm) {
    $("#confirmModalTitle").text(title);
    $("#confirmModalBody").text(message);

    $("#confirmModalBtn")
      .off("click")
      .on("click", function () {
        confirmModal.hide();
        if (onConfirm) onConfirm();
      });

    confirmModal.show();
  }
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function updateSelectAllCheckbox() {
    const totalCheckboxes = $("#usersTable tbody .row-check").length;
    const checkedCheckboxes = $("#usersTable tbody .row-check:checked").length;

    console.log(
      `updateSelectAllCheckbox - Total: ${totalCheckboxes}, Checked: ${checkedCheckboxes}`
    );

    if (totalCheckboxes === 0 || checkedCheckboxes === 0) {
      $("#checkAll").prop("checked", false);
    } else if (checkedCheckboxes === totalCheckboxes) {
      $("#checkAll").prop("checked", true);
    } else {
      $("#checkAll").prop("checked", false);
    }
  }

  function prependUserRow(u) {
    const statusClass = Number(u.status) ? "active" : "";

    const $row = $("<tr>").attr("data-id", u.id);

    $row.append(
      $("<td>").append($('<input type="checkbox" class="row-check">')),
      $("<td>").text(`${u.name_first} ${u.name_last}`),
      $("<td>").append($(`<span class="status-dot ${statusClass}"></span>`)),
      $("<td>").text(u.role_text),
      $("<td>").html(`
      <button class="btn btn-sm btn-outline-primary btn-edit" type="button" title="Edit">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger btn-delete" type="button" title="Delete">
        <i class="bi bi-trash"></i>
      </button>
    `)
    );

    $("#usersTable tbody").append($row);

    if ($("#checkAll").is(":checked")) {
      $row.find(".row-check").prop("checked", true);
    }
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

  // Select all
  $("#checkAll")
    .off("change")
    .on("change", function () {
      const checked = $(this).is(":checked");
      $("#usersTable tbody .row-check").prop("checked", checked);
    });

  $("#usersTable").on("change", ".row-check", function () {
    updateSelectAllCheckbox();

    const total = $("#usersTable tbody .row-check").length;
    const checked = $("#usersTable tbody .row-check:checked").length;
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

  $(".btn-add-user").off("click").on("click", openAddModal);

  // Edit
  $("#usersTable")
    .off("click", ".btn-edit")
    .on("click", ".btn-edit", function () {
      const id = $(this).closest("tr").data("id");

      $.getJSON("api/users.php", { action: "get", id })
        .done(function (res) {
          if (!res || !res.status) {
            if (res?.error?.code === 100) {
              showInfoModal(
                "This user has been deleted by another session. Cannot edit.",
                "Error"
              );
            } else {
              showInfoModal(res?.error?.message || "Error", "Error");
            }
            return;
          }

          const u = res.user;
          $("#userModalTitle").text("Edit user");
          $("#userId").val(u.id);
          $("#firstName").val(u.name_first);
          $("#lastName").val(u.name_last);
          $("#statusSwitch").prop("checked", !!Number(u.status));
          $("#role").val(u.role);
          clearValidation();
          userModal.show();
        })
        .fail(function (xhr) {
          console.log("get FAIL:", xhr.status, xhr.responseText);

          showInfoModal("An error occurred while fetching user data.", "Error");
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
      const userId = $("#userId").val();

      const payload = {
        action: userId ? "update" : "create",
        id: userId,
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
            if (res?.error?.code === 107) {
              userModal.hide();
              showInfoModal(
                "This user has been deleted by another session. Cannot update.",
                "Error"
              );
            } else {
              showInfoModal(res?.error?.message || "Error", "Error");
            }
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
            if ($("#checkAll").is(":checked")) {
              $(
                `#usersTable tbody tr[data-id='${newUser.id}'] .row-check`
              ).prop("checked", true);
            }
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
          showInfoModal("An error occurred while saving", "Error");
        })
        .always(function () {
          $saveBtn.prop("disabled", false);
        });
    });

  // Single delete
  $("#usersTable").on("click", ".btn-delete", function () {
    const row = $(this).closest("tr");
    const userId = row.data("id");
    const userName = row.find("td:eq(1)").text().trim();

    showConfirmModal(
      "Confirm delete",
      `Are you sure you want to delete user ${userName}?`,
      function () {
        $.ajax({
          url: "api/users.php?action=delete",
          method: "POST",
          data: { id: userId },
          dataType: "json",
        })
          .done(function (res) {
            if (!res || !res.status) {
              showInfoModal(res?.error?.message || "Error", "Error");
              return;
            }
            $(`#usersTable tbody tr[data-id="${userId}"]`).remove();
            updateSelectAllCheckbox();
          })
          .fail(function (xhr) {
            showInfoModal("An error occurred while deleting user.", "Error");
          });
      }
    );
  });

  function validateAndRunBulk(actionType, ids, $selectElement) {
    $.ajax({
      url: "api/users.php?action=validate_ids",
      method: "POST",
      data: { ids: ids },
      dataType: "json",
    })
      .done(function (res) {
        if (!res || !res.status) {
          showInfoModal(res?.error?.message || "Error", "Error");
          return;
        }

        const validIds = res.valid_ids || [];
        const invalidIds = ids.filter((id) => !validIds.includes(id));

        if (invalidIds.length > 0) {
          invalidIds.forEach(function (id) {
            $(`#usersTable tbody tr[data-id="${id}"] .row-check`).prop(
              "checked",
              false
            );
          });
          updateSelectAllCheckbox();

          if (actionType === "delete") {
            const message = `${invalidIds.length} user(s) have already been deleted by another session.`;
            showInfoModal(message, "Warning");

            invalidIds.forEach(function (id) {
              $(`#usersTable tbody tr[data-id="${id}"]`).remove();
            });
            updateSelectAllCheckbox();
          } else {
            const actionName =
              actionType === "set_active" ? "activate" : "deactivate";
            const message = `Cannot ${actionName} ${invalidIds.length} user(s) - they have been deleted by another session.`;
            showInfoModal(message, "Error");
          }
        }

        if (validIds.length === 0) {
          return;
        }
        if (actionType !== "delete") {
          doBulkRequest(actionType, validIds, $selectElement);
        } else {
          showConfirmModal(
            "Confirm bulk delete",
            `Are you sure you want to delete ${validIds.length} selected user(s)?`,
            () => {
              doBulkRequest("delete", validIds, $selectElement);
            }
          );
        }
      })
      .fail(function (xhr) {
        console.log("validate FAIL:", xhr.status, xhr.responseText);
        showInfoModal("An error occurred during validation", "Error");
      });
  }

  function doBulkRequest(actionType, ids, $selectElement) {
    $.ajax({
      url: "api/users.php?action=bulk",
      method: "POST",
      data: { action_type: actionType, ids: ids },
      dataType: "json",
    })
      .done(function (res) {
        console.log("BULK RESPONSE:", res);

        if (!res || !res.status) {
          showInfoModal(res?.error?.message || "Error", "Error");
          return;
        }

        $selectElement.val("");

        const processedIds = res.processed_ids || [];
        const notProcessed = ids.filter((id) => !processedIds.includes(id));

        console.log("IDs sent:", ids);
        console.log("Processed:", processedIds);
        console.log("Not processed:", notProcessed);

        if (actionType === "delete") {
          processedIds.forEach(function (id) {
            console.log(`Deleting row ${id}`);
            $(`#usersTable tbody tr[data-id="${id}"]`).remove();
          });

          if (notProcessed.length > 0) {
            console.log("REMOVING NOT PROCESSED ROWS:", notProcessed);
            notProcessed.forEach(function (id) {
              $(`#usersTable tbody tr[data-id="${id}"]`).remove();
            });
          }
        } else if (actionType === "set_active") {
          processedIds.forEach(function (id) {
            const row = $(`#usersTable tbody tr[data-id="${id}"]`);
            console.log(`Setting active for ${id}, row found:`, row.length > 0);
            row
              .find("td:eq(2)")
              .html('<span class="status-dot bg-success"></span>');
          });
        } else if (actionType === "set_not_active") {
          processedIds.forEach(function (id) {
            const row = $(`#usersTable tbody tr[data-id="${id}"]`);
            console.log(
              `Setting not active for ${id}, row found:`,
              row.length > 0
            );
            row
              .find("td:eq(2)")
              .html('<span class="status-dot bg-secondary"></span>');
          });
        }

        $("#usersTable tbody .row-check:checked").prop("checked", false);

        updateSelectAllCheckbox();
      })
      .fail(function (xhr) {
        console.log("bulk FAIL:", xhr.status, xhr.responseText);
        showInfoModal("An error occurred during bulk operation", "Error");
      });
  }

  function runBulk($selectElement) {
    const actionType = $selectElement.val();

    //збираємо ID з DOM
    const ids = [];
    $("#usersTable tbody tr").each(function () {
      const checkbox = $(this).find(".row-check");
      if (checkbox.length > 0 && checkbox.is(":checked")) {
        ids.push($(this).data("id"));
      }
    });

    if (!ids.length) {
      showInfoModal("Please select at least one user.", "Warning");
      return;
    }
    if (!actionType) {
      showInfoModal("Please select an action.", "Warning");
      return;
    }

    //перевірка існування користувачів
    validateAndRunBulk(actionType, ids, $selectElement);
  }

  $(document).on("click", ".btn-bulk-ok", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const $select = $(this)
      .closest(".table-controls")
      .find(".bulk-action-select");
    runBulk($select);
  });
});
