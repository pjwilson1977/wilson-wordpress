<?php


add_filter('mepr-process-login-redirect-url', 'cart_login_redirect_url_fn', 11, 2);
function cart_login_redirect_url_fn($url, $user) {
    if(! WC()->cart->is_empty() ) {
        return get_site_url().'/checkout/';
    }
}


add_action('wp_ajax_contact_validation', 'cci_woocommerce_contact_ajax_lookup');
add_action('wp_ajax_nopriv_contact_validation', 'cci_woocommerce_contact_ajax_lookup');
add_action('wp_ajax_abn_validation', 'cci_woocommerce_abn_ajax_lookup');
add_action('wp_ajax_nopriv_abn_validation', 'cci_woocommerce_abn_ajax_lookup');
add_filter('wp_footer', 'cci_woocommerce_account_ajax_script');
function cci_woocommerce_account_ajax_script () {
    if(is_checkout()) {    
        echo '<script type="text/javascript">';
        echo '  window.ajaxurl = "' . admin_url() . '/admin-ajax.php";';
        echo '</script>';        
        echo '<script type="text/javascript" src="' . get_stylesheet_directory_uri() . '/common/js/account.js"></script>';
    }
}


function cci_woocommerce_contact_ajax_lookup () {
    $email = $_POST['userInput'];
    $exists = email_exists($email);
    if( $exists ) {
        //echo 'Found ';
        $result = [
            "Message" => 'Found in Wordpress',
            "Code" => 1,
            "Status" => false
        ];
        $json = json_encode($result);
        echo $json;
    }
    else {
        $contactRecord = cci_crm_integration_fetch_contact_by_email($email);
        $count = count($contactRecord);
        if( $count > 0) {
            $contactActive = 0;
            foreach($contactRecord as $contact) {
                if($contact->CrmContactActive == 1 && $contact->HasRoleWebsiteAccess == 1) {
                    $contactActive++;
                }
            }

            if( $contactActive > 1) {
                //echo 'Not found in Wordpress - ' . $contactActive .' active contact records ';
                $result = [
                    "Message" => 'Not found in Wordpress - ' . $contactActive .' active contact records ',
                    "Code" => 3,
                    "Status" => false
                ];
            } else if( $contactActive == 1) {
                //echo 'Not found in Wordpress - Contact exists in MW and is active and has website access';
                $result = [
                    "Message" => 'Not found in Wordpress - Contact exists in MW and is active and has website access',
                    "Code" => 2,
                    "Status" => false
                ];
            } else {
                // If it gets here then there is a record which is either no website access or the contact record is inactive
                if ($contactRecord[0]->CrmContactActive == 1) {
                    //echo 'Not found in Wordpress - Contact exists in MW and active but no website access';
                    $result = [
                        "Message" => 'Not found in Wordpress - Contact exists in MW and active but no website access',
                        "Code" => 4,
                        "Status" => false
                    ];
                } else {
                    //echo 'Not found in Wordpress - Contact exists in MW is not active';
                    $result = [
                        "Message" => 'Not found in Wordpress - Contact exists in MW is not active',
                        "Code" => 5,
                        "Status" => false
                    ];
                }
            }
        } else {
            //echo 'Not found in Wordpress or in MW ';
            $result = [
                "Message" => 'Not found in Wordpress or in MW ',
                "Code" => 6,
                "Status" => true
            ];
        }

        $json = json_encode($result);
        echo $json;

    }
    exit();
}

function cci_woocommerce_abn_ajax_lookup () {
    $abn = $_POST['userInput'];
    $accountRecord = cci_crm_integration_fetch_account_by_abn($abn);
    $count = count($accountRecord);

    if( $count > 0) {
        $result = [
            "Message" => 'ABN found in MW ',
            "Code" => 7,
            "Status" => false
        ];
    } else {
        $result = [
            "Message" => 'ABN not found in MW ',
            "Code" => 8,
            "Status" => true
        ];
    }
    $json = json_encode($result);
    echo $json;

    exit();
}



// ABN/ACN Lookup PHP function - Gravity Forms
add_filter( 'gform_field_validation_1_7', 'gf_abn_validation', 10, 4 );
function gf_abn_validation( $result, $value, $form, $field ) {
    $validNumber = false;
    GFCommon::log_debug( __METHOD__ . '(): ABN Number Entered: ' . $value );

    if( strlen($value) === 11 ) {
        $validNumber = abnCheck($value);
    } elseif ( strlen($value) === 9 ) {
        $validNumber = acnCheck($value);
    } else {
        $result['is_valid'] = false;
        $result['message'] = 'Please enter a valid ABN or ACN number';
    }

    if ( $validNumber === false ) {
        $result['is_valid'] = false;
        $result['message'] = 'Please enter a valid ABN or ACN number';
    }
    return $result;
}

function abnCheck($abnValue) {
    $weightings = array(10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19);
    // assume no whitespaces, data should be clean before calling this function
    $abn = str_split($abnValue);

    // Subtract 1 from the first (left-most) digit of the ABN to give a new 11 digit number
    $abn[0] = $abn[0] - 1;

    // Multiply each of the digits in this new number by a "weighting factor" based on its position as shown in the table below
    $total = 0;
    $length = count($abn);
    for ($i = 0; $i < $length; $i++) {
        // Sum the resulting 11 products
        $total += $abn[$i] * $weightings[$i];
    }

    // Get the remainder after dividing the total by 89 - if there's no remainder the ABN entered is in the correct format
    if ($total % 89 === 0) {
        return true;
    }
    return false;
}

function acnCheck($acnValue) {
    $weightings = array(8,7,6,5,4,3,2,1);
    // assume no whitespaces, data should be clean before calling this function
    $acn = str_split($acnValue);

    // Multiply each of the digits in this new number by a "weighting factor" based on its position as shown in the table below
    $total = 0;
    $length = count($acn);
    for ($i = 0; $i < $length-1; $i++) {
        // Sum the resulting 11 products
        $total += $acn[$i] * $weightings[$i];
    }

    // Ensure that the remainder is equal to the last digit which is the checksum
    $remainder = $total % 10;
    if( (10 - $remainder) == $acn[$length-1] || remainder == 0) {
        return true;
        
    }
    return false;
}
