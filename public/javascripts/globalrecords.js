// DOM Ready =============================================================
$(document).ready(function() {

    // Username link click
    $('#btnRecordsSearch').on('click', searchRecords);
    $('#btnRecordsSave').on('click', postSaveRecord);
    $('#btnUploadCover').on('click', uploadRecord);
    $('#btnRecordsResetInputFields').on('click', resetInputFields);
    $('input#inputGroupName').keydown(function(event){searchRecordsOnReturn(event)});
    $('input#inputTitle').keydown(function(event){searchRecordsOnReturn(event)});
    $('input#inputFormat').keydown(function(event){searchRecordsOnReturn(event)});
    $('input#inputLabel').keydown(function(event){searchRecordsOnReturn(event)});
    $('input#inputCountry').keydown(function(event){searchRecordsOnReturn(event)});
    $('input#inputYear').keydown(function(event){searchRecordsOnReturn(event)});
    $('input#inputPeriod').keydown(function(event){searchRecordsOnReturn(event)});
    $('#recordsList table tbody').on('click', 'td i.material-icons', deleteRecord);
});

// Functions =============================================================

// Call search records function on return Key
function searchRecordsOnReturn(event){
    if (event.keyCode == 13) {
    	searchRecords(event);
    }
};

// Fill table with data
function populateTable(data) {

    // Empty content string
    var tableContent = '';
    var i = 0;
        
    // For each item in our JSON, add a table row and cells to the content string
    $.each(data, function(){
        i++;
        tableContent += '<tr>';
        tableContent += '<td>'+ i + '</td>';
        if (typeof this.Artist != 'undefined') {
	        tableContent += '<td>'+ this.Artist + '</td>';
	    }
	    else {
	    	tableContent += '<td></td>';
	    }
        if (typeof this.Title != 'undefined') {
        	tableContent += '<td>' + this.Title + '</td>';
	    }
	    else {
	    	tableContent += '<td></td>';
	    }
        if (typeof this.Format != 'undefined') {
        	tableContent += '<td>'+ this.Format + '</td>';
	    }
	    else {
	    	tableContent += '<td></td>';
	    }
        if (typeof this.Label != 'undefined') {
        	tableContent += '<td>' + this.Label + '</td>';
	    }
	    else {
	    	tableContent += '<td></td>';
	    }
        if (typeof this.Country != 'undefined') {
        	tableContent += '<td>'+ this.Country + '</td>';
	    }
	    else {
	    	tableContent += '<td></td>';
	    }
        if (typeof this.Reference != 'undefined') {
        	tableContent += '<td>' + this.Reference + '</td>';
	    }
	    else {
	    	tableContent += '<td></td>';
	    }
        if (this.Year != 0) {
	        tableContent += '<td>'+ this.Year + '</td>';        	
        }
	    else {
	    	tableContent += '<td></td>';
	    }
        if (typeof this.Period != 'undefined') {
    	    tableContent += '<td>' + this.Period + '</td>';
	    }
	    else {
	    	tableContent += '<td></td>';
	    }
        if (typeof this.Comments != 'undefined') {
	        tableContent += '<td>' + this.Comments + '</td>';
	    }
	    else {
	    	tableContent += '<td></td>';
	    }
        if (typeof this.ImageFileName != 'undefined') {
	        tableContent += '<td><img src="/uploads/'+ this.ImageFileName +'" alt="" border=3 height=100 width=100></img></td>';
	    }
	    else {
	    	tableContent += '<td></td>';
	    }
		tableContent += '<td><i class="material-icons" rel="' + this._id + '">delete</i></td>';
        tableContent += '</tr>';
    });

    if (i > 1) {
	    $('#recordsNumberOfResults p').html("Your search matches " + i + " records in the collection.");
    }
    else if (i > 0) {
	    $('#recordsNumberOfResults p').html("Your search matches " + i + " record in the collection.");
    }
    else {
	    $('#recordsNumberOfResults p').html("Your search doesn't match any record in the collection.");
    }

    // Inject the whole content string into our existing HTML table
    $('#recordsList table tbody').html(tableContent);
};

function searchRecords(event) {

    event.preventDefault();

    var queryString = '?'+  $.param(
    	{
    	Style : $('#recordsSearch table select#selectStyle').val(),  
    	Artiste: $('#recordsSearch table input#inputGroupName').val(), 
    	Titre: $('#recordsSearch table input#inputTitle').val(),
    	Format: $('#recordsSearch table input#inputFormat').val(),
    	Label: $('#recordsSearch table input#inputLabel').val(),
    	Country: $('#recordsSearch table input#inputCountry').val(),
    	Year: $('#recordsSearch table input#inputYear').val(),
    	Period: $('#recordsSearch table input#inputPeriod').val(),
    	Sort : $('#recordsSearch table select#selectSort').val()
    	});

    $.ajax({
        type: 'GET',
        url: '/records/searchrecords'+ queryString,
        dataType: 'JSON'
    }).done(function( response ) {

        // Check for a successful (blank) response
        if (response.msg === '') {
            alert('Error !');
        }
        else {
            // Update the table
            populateTable(response);
        }
    });
};


function postSaveRecord(event) {

    event.preventDefault();

    // Super basic validation - increase errorCount variable if any fields are blank
    var errorCount = 0;
    $('#recordsSearch table input').each(function(index, val) {
        if($(this).val() === '') { errorCount++; }
    });

    // Check and make sure errorCount's still at zero
    if(errorCount === 0) {

	    var newRecord = {
	    	'Style' : $('#recordsSearch table select#selectStyle').val(),  
	    	'Artist': $('#recordsSearch table input#inputGroupName').val(),
	    	'Title': $('#recordsSearch table input#inputTitle').val(),
	    	'Format': $('#recordsSearch table input#inputFormat').val(),
	    	'Label': $('#recordsSearch table input#inputLabel').val(),
	    	'Country': $('#recordsSearch table input#inputCountry').val(),
	    	'Year': Number($('#recordsSearch table input#inputYear').val()),
	    	'Period': $('#recordsSearch table input#inputPeriod').val()
	    }

	    // Standard Javascript DOM element retrieval
	    var fileInput = document.getElementById('inputCoverFile');  

		if (fileInput.files.length !== 0) {
	    	newRecord.ImageFileName = fileInput.files[0].name;
	    }

		//alert(JSON.stringify(newRecord));

	    $.ajax({
	        type: 'POST',
	        data: newRecord,
	        url: '/records/saverecord',
	        dataType: 'JSON'
	    }).done(function( response ) {

	            // Check for successful (blank) response
	            if (response.msg === '') {
	            	if (fileInput.files.length !== 0) {
						uploadRecord(event);
	            	}
	            }
	            else {

	                // If something goes wrong, alert the error message that our service returned
	                alert('Error: ' + response.msg);
	            }

	            // Update the table
	            searchRecords(event);
	    });

    }
    else {
        alert('Please fill in all fields');
        return false;
    }

};


function uploadRecord(event) {

    event.preventDefault();

    var formData = new FormData($('#recordsUploadForm')[0]);


    $.ajax({
        type: 'POST',
        data:  formData,
        url: '/records/uploadcover',
        enctype: 'multipart/form-data',
        processData: false, 
        contentType: false,
        cache: false,
        success: (data) => {
            alert('File uploaded successfully !');
        },
        error: (e) => {
            alert(e.responseText);
        }
    });

};

// Delete Record
function deleteRecord(event) {

    event.preventDefault();

    // Pop up a confirmation dialog
    var confirmation = confirm('Are you sure you want to delete this record?');

    // Check and make sure the user confirmed
    if (confirmation === true) {

	    var queryString = '?'+  $.param(
	    	{
	    	Style : $('#recordsSearch table select#selectStyle').val(),  
	    	ID:  $(this).attr('rel')
	    	});

        // If they did, do our delete
        $.ajax({
            type: 'DELETE',
            url: '/records/deleterecord/' + queryString
        }).done(function( response ) {

            // Check for a successful (blank) response
            if (response.msg === '') {
            }
            else {
                alert('Error: ' + response.msg);
            }

            // Update the table
            searchRecords(event);

        });
    }
    else {
        // If they said no to the confirm, do nothing
        return false;
    }
};

function resetInputFields(event){
    event.preventDefault();

	$('input').each(function(){
		$(this).val('');
	});
};