$(document).ready(function () {
  // STATUS CODES - jQuery implementation
  // Contact------------------------------------------------------------------------
  // 1  User Account Exists in Wordpress
  // 2  Email Contact Exists (web access)
  // 3  Email Contact Exists Multiple (multiple active & multiple web access)
  // 4  Email Contact Exists (no web access)
  // 5  Email Contact Exists (Inactive)
  // 6  Email Contact Doesn't Exist
  // Account------------------------------------------------------------------------
  // 7  Account with ABN exists - Sample Clean ABN - 74 108 538 030
  // 8  Account with ABN doesn't exist

  let emailAddress = true; // True = doesn't exist
  let abn = true; // True = doesn't exist
  let recheck = false; // Ensure once the record in CRM is fixed by Membership, that the account creation can occur immediately
  
  // Check in case of page refresh and clear of input data
  if($('#billing_email').val() === '') setCookieThirty('email-check', 'false');
  if($('#billing_abn').val() === '') setCookieThirty('abn-check', 'false');
  if($('#billing_email').val() === '' && $('#billing_abn').val() === '') setCookieThirty('check-code', 'false');

  let validationCode = parseInt(getCookie('check-code'));
  let codeInput = $('#input_75_18');

  // Check in case of page refresh
  if(validationCode) {
    $('.initial').addClass('d-none');
    $('#place_order').prop("disabled",false);
    $('#accountModal').modal('toggle');
    if(validationCode === 3) { $('.multiple').removeClass('d-none'); $('.modal-header').addClass('d-none'); if($('.support-form').length == 1 ) { $('.support-form').removeClass('d-none'); codeInput.val(`${validationCode} - Multiple Emails`); } }
    if(validationCode === 4) { $('.noaccess').removeClass('d-none'); $('.modal-header').addClass('d-none'); if($('.support-form').length == 1 ) { $('.support-form').removeClass('d-none'); codeInput.val(`${validationCode} - No Web Access`); }  }
    if(validationCode === 5) { $('.inactive').removeClass('d-none'); $('.modal-header').addClass('d-none'); if($('.support-form').length == 1 ) { $('.support-form').removeClass('d-none'); codeInput.val(`${validationCode} - Inactive Contact`); } }
    if(validationCode === 7) { $('.abnexists').removeClass('d-none'); $('.modal-header').addClass('d-none'); if($('.support-form').length == 1 ) { $('.support-form').removeClass('d-none'); codeInput.val(`${validationCode} - ABN Exists in CRM`); } }
  }

  // Add ABN error message if no ABN added
  if($('#billing_abn').val() == '' ) {
    $( '#billing_abn_field' ).append( "<span style='display:none;font-size:12px;' id='abn_invalid'>ABN or ACN number is invalid. If unsure of your ABN or ACN, please search <a href='https://abr.business.gov.au/' target='_blank'>here</a></span>" );
  }

  $( "#billing_email" ).change( () => {
    checkMiddleware('email');
  });

  $( ".code" ).click( function() {
    resetModal();
    recheck = true;
    // DELETE COOKIE
    let type = $(this).next('.type').text();
    checkMiddleware(type);
  });

  function checkMiddleware(type) {
    //console.log(`Starting: ${type}`);
    let userInput ='';
    let inputValidation ='';

    if(type == 'email') {
      userInput = $( "#billing_email" ).val();
      inputValidation = 'contact_validation';
    }
    if(type == 'abn') {
      userInput = $( "#billing_abn" ).val();
      inputValidation = 'abn_validation';
    }

    if(userInput.length > 5) {
      $('#place_order').prop("disabled",true);
      $('#accountModal').modal({
        backdrop: 'static',
        keyboard: false
      });

      resetModal();

      $.post(
          ajaxurl,
          {
            action: inputValidation,
            userInput: userInput
          },
          (response) => {
            var data = JSON.parse(response);
            if (data) {
              console.log('Data received: ', data['Code']);
            }
            else {
              console.log('issue via JS');
            }

            if($('.support-form').length == 0 ) {
              $('.code').text(`Code: ${data['Code']}`);
              $('.type').text(type);
              $('.code').removeClass('d-none');
            }
            let emailInput = $('#input_75_2');
            if($('#billing_email').val().length > 0 ) { emailInput.val($('#billing_email').val()); } else { emailInput.val(''); }
            let firstNameInput = $('#input_75_1_3');
            if($('#billing_first_name').val().length > 0 ) { firstNameInput.val($('#billing_first_name').val()); } else { firstNameInput.val(''); }
            let lastNameInput = $('#input_75_1_6');
            if($('#billing_last_name').val().length > 0 ) { lastNameInput.val($('#billing_last_name').val()); } else { lastNameInput.val(''); }
            let phoneInput = $('#input_75_5');
            if($('#billing_phone').val().length > 0 ) { phoneInput.val($('#billing_phone').val()); } else { phoneInput.val(''); }
            let abnInput = $('#input_75_17');
            if($('#billing_abn').val().length > 0 ) { abnInput.val($('#billing_abn').val()); } else { abnInput.val(''); }

            if(type == 'email') emailAddress = data['Status'];
            if(type == 'abn') abn = data['Status'];

            if(abn && emailAddress) {
              $('#place_order').prop("disabled",false);
              $('#accountModal').modal('toggle');
              setCookieThirty(type + '-check', 'true');
              setCookieThirty('check-code', 'false');
            } else {
              $('.initial').addClass('d-none');

              if(data['Code'] === 1) {
                let loginLink =  $('#login').attr('href');
                location = loginLink;
              }
              // Email Specific
              if(data['Code'] === 2) {
                let createLink = $('#create').attr('href') + '?type=checkout&email=' + $( "#billing_email" ).val();
                location = createLink;
              }

              // Set to false until passed
              setCookieThirty(type + '-check', 'false');
              setCookieThirty('check-code', data['Code']);

              if(data['Code'] === 3) { $('.multiple').removeClass('d-none'); $('.modal-header').addClass('d-none'); $('.support-form').removeClass('d-none'); if($('.support-form').length == 1 ) { codeInput.val(`${data['Code']} - Multiple Emails`); } return; }
              if(data['Code'] === 4) { $('.noaccess').removeClass('d-none'); $('.modal-header').addClass('d-none'); $('.support-form').removeClass('d-none'); if($('.support-form').length == 1 ) { codeInput.val(`${data['Code']} - No Web Access`); } return; }
              if(data['Code'] === 5) { $('.inactive').removeClass('d-none'); $('.modal-header').addClass('d-none'); $('.support-form').removeClass('d-none'); if($('.support-form').length == 1 ) { codeInput.val(`${data['Code']} - Inactive Contact`); } return; }
              // ABN Specific
              if(data['Code'] === 7) { $('.abnexists').removeClass('d-none'); $('.modal-header').addClass('d-none'); $('.support-form').removeClass('d-none'); if($('.support-form').length == 1 ) { codeInput.val(`${data['Code']} - ABN Exists in CRM`);  } return; }

            }

          }
      );
    } else {
      console.log("Less than 5");
      $('#place_order').prop("disabled",false);
    }

  }


  $("#billing_abn").change(() => {
    const wrapper = $(this).closest(".form-row");
    // Get ABN value and remove spaces if included

    let abnNumber = $("#billing_abn").val();
    let abnNumbers = abnNumber.split(" ");

    let numLength = abnNumber.length;
    if (abnNumbers.length > 1) {
      let cleanABN = "";
      for (let i = 0; i < abnNumbers.length; i++) {
        cleanABN = cleanABN + abnNumbers[i];
      }
      $("#billing_abn").val(cleanABN);
      numLength = cleanABN.length;
    }

    // you do not have to removeClass() because Woo do it in checkout.js - 96929977984
    const alphaRegex = new RegExp("[a-zA-Z]");
    let abnValid = IsValidABN($("#billing_abn").val());
    let acnValid = IsValidACN($("#billing_abn").val());

    if (!alphaRegex.test($(this).val()) && numLength == 11 && abnValid) {
      // check if contains numbers
      wrapper.addClass("woocommerce-validated"); // success
      $("#abn_invalid").css("display", "none");
    } else if (!alphaRegex.test($(this).val()) && numLength == 9 && acnValid) {
      wrapper.addClass("woocommerce-validated"); // success
      $("#abn_invalid").css("display", "none");
    } else {
      setTimeout(() => {
        $("#billing_abn_field").removeClass("woocommerce-validated"); // remove default validated
        $("#billing_abn_field").addClass("woocommerce-invalid"); // error
        if (!abnValid || !acnValid) {
          $("#abn_invalid").css("display", "block");
        }
      }, 200);
    }

    // Disable Place Order button
    $("#place_order").prop("disabled", true);
    // Show overlay and message

    if (abnValid || acnValid) {
      // Check Middleware AJAX
      checkMiddleware("abn");
    }
  });

  function IsValidABN(abn) {
    const weightings = new Array(10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19);
    // assume no whitepsaces, data should be clean before calling this function
    abn = abn.toString();
    abn = abn.split("").map((n) => parseInt(n));
    // Subtract 1 from the first (left-most) digit of the ABN to give a new 11 digit number
    abn[0] = abn[0] - 1;
    // Multiply each of the digits in this new number by a "weighting factor" based on its position as shown in the table below
    abn = abn.map((n, i) => n * weightings[i]);
    // Sum the resulting 11 products
    let total = abn.reduce((subtotal, n) => {
      return subtotal + n;
    }, 0);
    // Get the remainder after dividing the total by 89 - if there's no remainder the ABN entered is in the correct format
    if (total % 89 === 0) {
      return true;
    }
    return false;
  }

  function IsValidACN(acn) {
    const weightings = new Array(8, 7, 6, 5, 4, 3, 2, 1);
    // assume no whitepsaces, data should be clean before calling this function
    acn = acn.toString();
    acn = acn.split("").map((n) => parseInt(n));
    let total = 0;
    let acnLength = acn.length - 1;

    // Sum & Multiply each of the digits in this new number by a "weighting factor" based on its position as shown in the table below
    for (let i = 0; i < acnLength; i++) {
      total += acn[i] * weightings[i];
    }
    // Get the remainder after dividing the total by 89 - if there's no remainder the ABN entered is in the correct format
    let remainder = total % 10;
    if (10 - remainder == acn[acnLength] || remainder == 0) {
      return true;
    }
    return false;
  }

  function resetModal() {
    $(".initial").removeClass("d-none");
    $(".exists").addClass("d-none");
    $(".middleware").addClass("d-none");
    $(".multiple").addClass("d-none");
    $(".noaccess").addClass("d-none");
    $(".inactive").addClass("d-none");
    $(".abnexists").addClass("d-none");
    $(".code").addClass("d-none");
  }
  
  function setCookieThirty(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (30*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
  
});
