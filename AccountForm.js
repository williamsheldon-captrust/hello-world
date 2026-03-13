"use strict";
/// <reference path="../common/FormScriptingHelper.ts" />
/// <reference path="../common/QueryHelper.ts" />
/// <reference path="../../../typings/xrm/xrm.d.ts" />
/// <reference path="../common/moment/moment.min.js" type = "text/javascript" > check
/// <reference path="clientreviewmeeting.ts" />
/// <reference path="../fields/contactFields.ts" />
//*****************************************************************************
// Filename:    AccountForm.js
// Purpose:     This file contains the form script for the Account entity (Client)
// Dependencies: 
//      
//*****************************************************************************
var AccountForm;
(function (AccountForm) { 
  debugger;
  
    var fcrUrl = "navLink{191b9aa3-c8b9-615c-cb03-20153d91898c}";
    var isloading = true;
    var apiCallSuccessful;
    var initial_name;
    var initial_ownerid;
    function Form_Load(executionContext) {
        FormScriptingHelper.setFormContext(executionContext.getFormContext());
        FormScriptingHelper.addOnChange(accountFields.ct_emoneyid, emoneyid_OnChange);
        ((FormScriptingHelper.getFormContext().ui.tabs.get("tab_WealthView")).addTabStateChange(WealthviewTabFocus));
        //establish onchange events for attributes
        FormScriptingHelper.addOnChange(accountFields.ct_clienttype, Clienttype_OnChange);
        FormScriptingHelper.addOnChange(accountFields.ct_highereducation, HigherEducation_OnChange);
        FormScriptingHelper.addOnChange("ct_activeproviders", HigherEducation_OnChange);
        FormScriptingHelper.addOnChange("ct_frozenproviders", HigherEducation_OnChange);
        FormScriptingHelper.addOnChange("ct_who", HigherEducation_OnChange);
        FormScriptingHelper.addOnChange(accountFields.ct_oar, onOrganicChange);
        FormScriptingHelper.addOnChange("ct_naicscode", NAICS_validateInput);
        FormScriptingHelper.addOnChange(accountFields.ct_prodfinplan, FinancialPlanning_OnChange);
        FormScriptingHelper.addOnChange(accountFields.ct_lastmeetingdate, OnLastMeetingDTFreqchange);
        FormScriptingHelper.addOnChange(accountFields.ct_meetingfrequency, OnLastMeetingDTFreqchange);
        FormScriptingHelper.addOnChange(accountFields.ct_clienttype, hideCaptrustServices);
        FormScriptingHelper.addOnChange(accountFields.ct_industry, ct_industry_OnChange);
        FormScriptingHelper.addOnChange(accountFields.ownerid, HideAndShowRAPInfo);
        FormScriptingHelper.hideTab("tab_RecurringServices");
        SetLegalEntityVisibility();
        isloading = true;
        SetRequiredFields();
        hideCaptrustServices();
        HideAndShowRAPInfo();
        Clienttype_OnChange(); //call this on load also to display the sections correctly
        SetMessageLabel();
        HigherEducation_OnChange(); //Hide and show for Higher Education
        //Add OnChange
        FormScriptingHelper.addOnChange(accountFields.statecode, statecode_OnChange);
        initial_name = FormScriptingHelper.getFieldValue(accountFields.name);
        initial_ownerid = FormScriptingHelper.getLookupValue(accountFields.ownerid).name;
        ct_industry_OnChange(true);
    }
    AccountForm.Form_Load = Form_Load;
    function ShowMeetingFreqNextMeeting() {
        try {
            if (FormScriptingHelper.getFieldValue(accountFields.ct_clienttype) == accountBooleanFields.ct_clienttype.Institutional) //0=Institutional, 1=Individual
             {
                FormScriptingHelper.hideField(accountFields.ct_meetingfrequency);
                FormScriptingHelper.hideField(accountFields.ct_nextmeetingdate);
            }
            else {
                FormScriptingHelper.showField(accountFields.ct_meetingfrequency);
                FormScriptingHelper.showField(accountFields.ct_nextmeetingdate);
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "ShowMeetingFreqNextMeeting");
            }
        }
    }
    AccountForm.ShowMeetingFreqNextMeeting = ShowMeetingFreqNextMeeting;
    function OnLastMeetingDTFreqchange() {
        try {
            var meetingFrequency = FormScriptingHelper.getOptionSetValue(accountFields.ct_meetingfrequency);
            var lastMeetingDate = FormScriptingHelper.getDateValue(accountFields.ct_lastmeetingdate);
            var lastMtDate = moment(lastMeetingDate);
            var nextMeeetingDate = new Date();
            var monthsDifffs = 0;
            if (lastMeetingDate != null && lastMeetingDate != undefined) {
                if (meetingFrequency != null) {
                    switch (meetingFrequency) {
                        case accountOptions.ct_meetingfrequency.Annually:
                            nextMeeetingDate = moment(lastMtDate).add('M', 12).toDate(); // + 12 Months                              
                            break;
                        case accountOptions.ct_meetingfrequency.Monthly:
                            nextMeeetingDate = moment(lastMtDate).add('M', 1).toDate(); //  + 1 month  
                            break;
                        case accountOptions.ct_meetingfrequency.Quarterly:
                            nextMeeetingDate = moment(lastMtDate).add('M', 3).toDate(); //  + 3 months
                            break;
                        case accountOptions.ct_meetingfrequency.Semi_Annually:
                            nextMeeetingDate = moment(lastMtDate).add('M', 6).toDate(); //  + 6 months
                            break;
                        case accountOptions.ct_meetingfrequency.Tri_Annually:
                            nextMeeetingDate = moment(lastMtDate).add('M', 4).toDate(); //  + 4 months
                            break;
                    }
                    FormScriptingHelper.setDateField(accountFields.ct_nextmeetingdate, nextMeeetingDate);
                }
                else {
                    FormScriptingHelper.setDateField(accountFields.ct_nextmeetingdate, null);
                }
            }
            else {
                FormScriptingHelper.setDateField(accountFields.ct_nextmeetingdate, null);
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "OnLastMeetingDTFreqchange");
            }
        }
    }
    AccountForm.OnLastMeetingDTFreqchange = OnLastMeetingDTFreqchange;
    function SetLegalEntityVisibility() {
        try {
            var hasTaxServices = CheckTaxServices();
            var isTax = CheckTaxSecurityAccess();
            if (hasTaxServices && isTax) {
                if (FormScriptingHelper.getFormContext().ui.navigation.items.get("nav_ct_account_ct_legalentity") != null) {
                    FormScriptingHelper.getFormContext().ui.navigation.items.get("nav_ct_account_ct_legalentity").setVisible(true);
                }
                FormScriptingHelper.showField("LegalEntities");
            }
            else {
                FormScriptingHelper.hideField("LegalEntities");
                if (FormScriptingHelper.getFormContext().ui.navigation.items.get("nav_ct_account_ct_legalentity") != null) {
                    FormScriptingHelper.getFormContext().ui.navigation.items.get("nav_ct_account_ct_legalentity").setVisible(false);
                }
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "SetLegalEntityVisibility ");
            }
        }
    }
    AccountForm.SetLegalEntityVisibility = SetLegalEntityVisibility;
    function CheckTaxSecurityAccess() {
        try {
            var SECURITY_TEAM_Tax_Services_TeamId = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + "ct_systemparameters" + "?$select=ct_name, ct_value&$filter=ct_systemparameterid eq " + '296B3BF2-4C96-EB11-B1AC-0022481FB747');
            var SECURITY_TEAM_Tax_Operations_TeamId = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + "ct_systemparameters" + "?$select=ct_name, ct_value&$filter=ct_systemparameterid eq " + 'C95E82F8-4C96-EB11-B1AC-0022481FB747');
            var SECURITY_TEAM_Business_Analyst_TeamId = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + "ct_systemparameters" + "?$select=ct_name, ct_value&$filter=ct_systemparameterid eq " + '0008328B-BFD0-E911-A82F-000D3A1780A6');
            var userID = FormScriptingHelper.getUserId();
            userID = FormScriptingHelper.removeBrackets(userID);
            //var result = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + "systemusers(" + userID + ")?$select=address1_addressid&$expand=teammembership_association($select=teamid,ct_teamdescription,name)");
            //changed to fetchxml so we could limit to just security teams.  Didn't want to pull in access team membership for performance reasons.
            var teamresult = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + "teams?fetchXml=%3Cfetch%20version%3D%221.0%22%20output-format%3D%22xml-platform%22%20mapping%3D%22logical%22%20distinct%3D%22true%22%3E%3Centity%20name%3D%22team%22%3E%3Cattribute%20name%3D%22name%22%20%2F%3E%3Cattribute%20name%3D%22businessunitid%22%20%2F%3E%3Cattribute%20name%3D%22teamid%22%20%2F%3E%3Cattribute%20name%3D%22teamtype%22%20%2F%3E%3Corder%20attribute%3D%22name%22%20descending%3D%22false%22%20%2F%3E%3Cfilter%20type%3D%22and%22%3E%3Ccondition%20attribute%3D%22ct_teamdescription%22%20operator%3D%22eq%22%20value%3D%224%22%20%2F%3E%3C%2Ffilter%3E%3Clink-entity%20name%3D%22teammembership%22%20from%3D%22teamid%22%20to%3D%22teamid%22%20visible%3D%22false%22%20intersect%3D%22true%22%3E%3Clink-entity%20name%3D%22systemuser%22%20from%3D%22systemuserid%22%20to%3D%22systemuserid%22%20alias%3D%22ab%22%3E%3Cfilter%20type%3D%22and%22%3E%3Ccondition%20attribute%3D%22systemuserid%22%20operator%3D%22eq%22%20uitype%3D%22systemuser%22%20value%3D%22%7B" + userID + "%7D%22%20%2F%3E%3C%2Ffilter%3E%3C%2Flink-entity%3E%3C%2Flink-entity%3E%3C%2Fentity%3E%3C%2Ffetch%3E");
            if (teamresult != null) {
                for (var i = 0; i < teamresult.value.length; i++) {
                    var teamRoleId = teamresult.value[i].teamid;
                    if (teamRoleId.toLowerCase() == SECURITY_TEAM_Tax_Services_TeamId.value[0].ct_value.toLowerCase() ||
                        teamRoleId.toLowerCase() == SECURITY_TEAM_Tax_Operations_TeamId.value[0].ct_value.toLowerCase() ||
                        teamRoleId.toLowerCase() == SECURITY_TEAM_Business_Analyst_TeamId.value[0].ct_value.toLowerCase()) {
                        return true;
                    }
                }
            }
            return false;
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "CheckTaxSecurityAccess");
            }
        }
    }
    AccountForm.CheckTaxSecurityAccess = CheckTaxSecurityAccess;
    function FinancialPlanning_OnChange() {
        try {
            if ((FormScriptingHelper.getFieldValue(accountFields.ct_clienttype) == accountBooleanFields.ct_clienttype.Individual) &&
                (FormScriptingHelper.getFieldValue(accountFields.ct_prodfinplan) == true)) {
                FormScriptingHelper.setCheckboxValue(accountFields.ct_fundinggoals, true);
                FormScriptingHelper.setCheckboxValue(accountFields.ct_riskmanagement, true);
            }
            else {
                FormScriptingHelper.setCheckboxValue(accountFields.ct_fundinggoals, false);
                FormScriptingHelper.setCheckboxValue(accountFields.ct_riskmanagement, false);
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "FinancialPlanning_OnChange");
            }
        }
    }
    AccountForm.FinancialPlanning_OnChange = FinancialPlanning_OnChange;
    function hideCaptrustServices() {
        try {
            var clientType = FormScriptingHelper.getFieldValue(accountFields.ct_clienttype);
            if (clientType != 1) {
                FormScriptingHelper.hideTab("captrust_services_tab");
            }
            else {
                FormScriptingHelper.showTab("captrust_services_tab");
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "hideCaptrustServices");
            }
        }
    }
    AccountForm.hideCaptrustServices = hideCaptrustServices;
    function GetMonteCarlo_Percent() {
        try {
            if (FormScriptingHelper.getFieldValue(accountFields.ct_emoneyid) != null) {
                var eMoneyId = FormScriptingHelper.getFieldValue(accountFields.ct_emoneyid);
                var Source = 'GetMonteCarlo_Percent';
                var data = {};
                var RQ = "CAPAPIURL";
                var url = QueryHelper.getSystemParameter(RQ).ct_value + "/GetNetWorth_MonteCarlo?eMoneyId=" + eMoneyId;
                //var url = "http://localhost:16187//GetNetWorth_MonteCarlo?eMoneyId=" + eMoneyId;
                var Token = "CAPAPIToken";
                var auth = QueryHelper.getSystemParameter(Token).ct_value;
                QueryHelper.CapApiPost(url, data, auth, onsuccess, true, onerror);
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "GetMonteCarlo_Percent");
            }
        }
    }
    AccountForm.GetMonteCarlo_Percent = GetMonteCarlo_Percent;
    //Show or Hide RAP info cards based on if lead consultant is in Minnetonka Office
    function HideAndShowRAPInfo() {
        var leadConsultant = FormScriptingHelper.getLookupValue(accountFields.ownerid);
        if (leadConsultant != null) {
            if (IsConsultantInBusinessUnit(leadConsultant.id, "MINRedcircle")) {
                FormScriptingHelper.showSection("SUMMARY_TAB", "primary_rap_tab");
                FormScriptingHelper.showSection("SUMMARY_TAB", "secondary_rap_tab");
            }
            else {
                FormScriptingHelper.hideSection("SUMMARY_TAB", "primary_rap_tab");
                FormScriptingHelper.hideSection("SUMMARY_TAB", "secondary_rap_tab");
            }
        }
        else {
            FormScriptingHelper.hideSection("SUMMARY_TAB", "primary_rap_tab");
            FormScriptingHelper.hideSection("SUMMARY_TAB", "secondary_rap_tab");
        }
    }
    //Show or Hide RAP info cards based on if lead consultant is in Minnetonka Office
    function IsConsultantInBusinessUnit(systemUserId, businessUnitName) {
        var uri = "\n              <fetch version=\"1.0\" output-format=\"xml-platform\" mapping=\"logical\" distinct=\"false\" >\n                <entity name=\"systemuser\" >\n                <attribute name=\"businessunitid\" />\n                <filter type=\"and\" >\n                    <condition attribute=\"systemuserid\" operator=\"eq\" value=\"".concat(systemUserId, "\" />\n                </filter>\n                <link-entity name='businessunit' from='businessunitid' to='businessunitid' link-type='inner'>\n                   <attribute name='name' />\n                   <filter type=\"and\" >\n                        <condition attribute=\"name\" operator=\"eq\" value=\"").concat(businessUnitName, "\" />\n                   </filter>\n                </link-entity>\n                </entity>\n            </fetch>\n        ");
        var fetch = encodeURIComponent(uri);
        var url = QueryHelper.getWebApiUrl() + "systemusers?fetchXml=" + fetch;
        var result = QueryHelper.webApiRequest(url);
        if (result.value.length > 0) {
            return true;
        }
        else {
            return false;
        }
    }
    function onSave() {
        try {
            var CLMFieldsChanged = false;
            var data;
            if (initial_name != FormScriptingHelper.getFieldValue(accountFields.name)) {
                CLMFieldsChanged = true;
            }
            if (initial_ownerid != FormScriptingHelper.getLookupValue(accountFields.ownerid).name) {
                CLMFieldsChanged = true;
            }
            // Check if Client is Instutitional.           
            if ((CLMFieldsChanged) &&
                (FormScriptingHelper.getFieldValue(accountFields.ct_clienttype) == 0)) //0=Institutional, 1=Individual
             {
                var clientid = FormScriptingHelper.getEntityId();
                // clmIntegrtion settings
                var RQ = "CLMIntegration";
                var url = QueryHelper.getSystemParameter(RQ).ct_value + "ClientChange";
                var urlCAPAPICRMData = QueryHelper.getSystemParameter("CLMCRMDataURL").ct_value;
                var Token = "CLMIntAPIToken";
                var auth = QueryHelper.getSystemParameter(Token).ct_value;
                var LeadConstultantResult = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + "systemusers(" + FormScriptingHelper.getLookupValue(accountFields.ownerid).id.replace(/[{}]/g, "") + ")?$select=ct_externalfullname,fullname,internalemailaddress,_ct_institutionalcmcid_value&$expand=ct_institutionalserviceteam($select=name)");
                var advisorName = LeadConstultantResult.ct_externalfullname;
                data =
                    {
                        "ClientGUID": clientid,
                        "ClientName": FormScriptingHelper.getFieldValue("name"),
                        "AdvisorName": advisorName
                    };
                apiCallSuccessful = false;
                QueryHelper.CapApiPost(url, data, auth, onsuccess_clmIntegrtion, false, onerror_clmIntegrtion);
                if (apiCallSuccessful == false) {
                    return;
                }
                else {
                    initial_name = FormScriptingHelper.getFieldValue(accountFields.name);
                    initial_ownerid = FormScriptingHelper.getLookupValue(accountFields.ownerid).name;
                }
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "onSave");
            }
        }
    }
    AccountForm.onSave = onSave;
    function onsuccess_clmIntegrtion(response) {
        // success will be indicated by the email popping up
        //alert("success " + response);
        apiCallSuccessful = true;
    }
    function onerror_clmIntegrtion(response) {
        apiCallSuccessful = false;
        alert("There was a problem calling clmIntegrtion. Please contact the Help Desk for assistance.");
    }
    function onsuccess(response) {
        var MonteCarlo = JSON.parse(response || "{}");
        var ProbabilityOfSuccess = MonteCarlo.probability;
        var Networth = MonteCarlo.netWorthAmount;
        FormScriptingHelper.setDecimalValue(accountFields.ct_probabilityofsuccess, ProbabilityOfSuccess);
        FormScriptingHelper.setDecimalValue(accountFields.ct_networth, Networth);
    }
    function onerror(response) {
        var test = JSON.parse(response || "{}");
        var alertStrings = { confirmButtonLabel: "Ok", text: "An error occured while trying to get (MonteCarlo ProbabilityOfSuccess)." };
        var alertOptions = { height: 170, width: 550 };
        //Xrm.Navigation.openAlertDialog(alertStrings, alertOptions).then()
    }
    function WealthviewTabFocus() {
        try {
            if (FormScriptingHelper.getFormContext().ui.tabs.get("tab_WealthView").getDisplayState() == "expanded") {
                //alert("tab_WealthView is active");
                GetMonteCarlo_Percent();
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "WealthviewTabFocus");
            }
        }
    }
    AccountForm.WealthviewTabFocus = WealthviewTabFocus;
    function NAICS_validateInput() {
        try {
            //get the value of the name field  
            var input = FormScriptingHelper.getFormContext().getControl("ct_naicscode").getValue();
            if (input != "") {
                //check if the last key pressed is a number  
                if (!isNaN(input) == false || input.length > 7 || input.search(/,/) != -1 || input.search(/-/) != -1 || input.search(/\./) != -1) {
                    //display the message  
                    FormScriptingHelper.setFieldNotification("ct_naicscode", "Only Numeric values are allowed and can not exceed 7 digits in the NAICS Code");
                }
                else {
                    FormScriptingHelper.clearFieldNotification("ct_naicscode");
                }
            }
            else {
                FormScriptingHelper.clearFieldNotification("ct_naicscode");
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "NAICS_validateInput");
            }
        }
    }
    AccountForm.NAICS_validateInput = NAICS_validateInput;
    function onOrganicChange() {
        var organic = FormScriptingHelper.getFieldValue(accountFields.ct_oar);
        if (organic == accountOptions.ct_oar.Organic) {
            FormScriptingHelper.makeFieldRequired(accountFields.ct_wonopportunityid);
        }
        else {
            FormScriptingHelper.makeFieldOptional(accountFields.ct_wonopportunityid);
        }
    }
    AccountForm.onOrganicChange = onOrganicChange;
    function SetMessageLabel() {
        var msg = FormScriptingHelper.getFieldValue(accountFields.ct_popupmessage);
        if (msg != null) {
            FormScriptingHelper.setTabLabel("PopupMessage", "**" + FormScriptingHelper.getTabLabel("PopupMessage"));
        }
    }
    AccountForm.SetMessageLabel = SetMessageLabel;
    //This function looks for any CaptrustServices related to this client that are tax compliance or tax consulting, return true if any, false if none
    function CheckTaxServices() {
        var clientid = FormScriptingHelper.getEntityId();
        var uri = "\n        <fetch version=\"1.0\" output-format=\"xml-platform\" mapping=\"logical\" distinct=\"false\">\n\t        <entity name=\"ct_captrustservice\">\n\t\t        <attribute name=\"ct_captrustserviceid\"/>\n\t\t        <attribute name=\"ct_name\"/>\n                        <filter type=\"or\" >\n                            <condition attribute=\"ct_services\" operator=\"eq\" value=\"206450009\" />\n                            <condition attribute=\"ct_services\" operator=\"eq\" value=\"206450007\" />\n                        </filter>\n                        <filter type=\"and\" >\n                            <condition attribute=\"ct_clientid\" operator=\"eq\" value=\"".concat(clientid, "\" />\n                        </filter>\n\t                        </entity>\n                        </fetch>\n");
        var fetch = encodeURIComponent(uri);
        //var fetch = "%3Cfetch%20version%3D%221.0%22%20output-format%3D%22xml-platform%22%20mapping%3D%22logical%22%20distinct%3D%22false%22%20%3E%3Centity%20name%3D%22msdyn_groupsheader%22%20%3E%3Cattribute%20name%3D%22msdyn_groupsheaderid%22%20%2F%3E%3Cattribute%20name%3D%22msdyn_name%22%20%2F%3E%3Cattribute%20name%3D%22createdon%22%20%2F%3E%3Corder%20attribute%3D%22msdyn_name%22%20descending%3D%22false%22%20%2F%3E%3Clink-entity%20name%3D%22msdyn_collaboration%22%20from%3D%22msdyn_collaborationid%22%20to%3D%22msdyn_collaborationid%22%20alias%3D%22ac%22%20%3E%3Cfilter%20type%3D%22and%22%20%3E%3Ccondition%20attribute%3D%22msdyn_refguidid%22%20operator%3D%22eq%22%20value%3D%22" + id + "%22%20%2F%3E%3Ccondition%20attribute%3D%22msdyn_entitylogicalname%22%20operator%3D%22eq%22%20value%3D%22" + name + "%22%20%2F%3E%3C%2Ffilter%3E%3C%2Flink-entity%3E%3C%2Fentity%3E%3C%2Ffetch%3E"
        var url = QueryHelper.getWebApiUrl() + "ct_captrustservices?fetchXml=" + fetch;
        var result = QueryHelper.webApiRequest(url);
        if (result.value.length > 0) {
            return true;
        }
        else
            return false;
    }
    AccountForm.CheckTaxServices = CheckTaxServices;
    function OfficeGroupAccess() {
        try {
            var Userid = FormScriptingHelper.removeBrackets(FormScriptingHelper.getUserId());
            var EntityId = FormScriptingHelper.getEntityId();
            var date = new Date();
            var name = FormScriptingHelper.getFieldValue(accountFields.name);
            var Currentdate = date.toISOString().slice(0, 10);
            var OGAccess = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + ct_officegroupaccessFields.entitySetName + "?$select=" + ct_officegroupaccessFields.ct_enddate + "&$filter=_ct_requestinguser_value eq " + Userid + " and _ct_clientid_value eq " + EntityId + " and " + ct_officegroupaccessFields.ct_enddate + " ge " + Currentdate + " and  statecode eq 0");
            if (OGAccess != null && OGAccess.value[0] != null && OGAccess.value[0] != undefined) {
                var enddate = OGAccess.value[0]["ct_enddate"];
                alert("You've already requested access to this group.  Access is set to expire on " + enddate + ". If you need an extension please submit another request after this date.");
            }
            else {
                var result = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + "msdyn_collaborations?$select=msdyn_collaborationid&$filter=msdyn_refguidid eq '" + EntityId + "'");
                if (result != null) {
                    if (result.value[0] != undefined) {
                        var collid = result.value[0]["msdyn_collaborationid"];
                        if (collid != null) {
                            var result2 = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + "msdyn_groupsheaders?$select=msdyn_objectid&$filter=_msdyn_collaborationid_value eq " + collid);
                            if (result2 != null) {
                                if (result2.value[0] != undefined) {
                                    var Groupid = result2.value[0]["msdyn_objectid"];
                                    var result1 = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + systemuserFields.entitySetName + "(" + Userid + ")?$select=" + systemuserFields.internalemailaddress + "," + systemuserFields.firstname + "," + systemuserFields.lastname + "," + systemuserFields.azureactivedirectoryobjectid + "," + systemuserFields.systemuserid);
                                    if (result1 != null) {
                                        var emailid = result1[systemuserFields.internalemailaddress];
                                        var firstname = result1[systemuserFields.firstname];
                                        var lastname = result1[systemuserFields.lastname];
                                        var azureid = result1[systemuserFields.azureactivedirectoryobjectid];
                                        var requestinguser = result1[systemuserFields.systemuserid];
                                        var Addmember = "AddOGMember";
                                        var Addmemberurl = QueryHelper.getSystemParameter(Addmember).ct_value;
                                        var data = data = {
                                            "groupId": Groupid,
                                            "userId": azureid
                                        };
                                        QueryHelper.webApiPost(Addmemberurl, data, function Oncomplete() {
                                            var OGAccessurl = QueryHelper.getWebApiUrl() + "ct_officegroupaccesses";
                                            var entity = {};
                                            entity[ct_officegroupaccessFields.ct_name] = firstname + " " + lastname + "_" + name;
                                            entity["ct_ClientId@odata.bind"] = "/accounts(" + EntityId + ")";
                                            entity["ct_requestinguser@odata.bind"] = "/systemusers(" + Userid + ")";
                                            entity[ct_officegroupaccessFields.ct_emailid] = emailid;
                                            entity[ct_officegroupaccessFields.ct_officegroupid] = Groupid;
                                            date.setDate(date.getDate() + 7);
                                            var end = date.toISOString().slice(0, 10);
                                            entity[ct_officegroupaccessFields.ct_startdate] = Currentdate;
                                            entity[ct_officegroupaccessFields.ct_enddate] = end;
                                            entity[ct_officegroupaccessFields.ct_azureadid] = azureid;
                                            QueryHelper.webApiPost(OGAccessurl, entity, function complete() {
                                                alert("Your request for access is being processed, please allow up to 30 minutes for this process to complete.");
                                            });
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "OfficeGroupAccess");
            }
        }
    }
    AccountForm.OfficeGroupAccess = OfficeGroupAccess;
    function getTeamDetails() {
        try {
            var loggedinUser = FormScriptingHelper.getUserName();
            var userID = FormScriptingHelper.getUserId();
            userID = FormScriptingHelper.removeBrackets(userID);
            var TeamId1 = '';
            var TeamId2 = '';
            //GET "SECURITY TEAM Financial Advisors (FA)" CT_SYSTEMPARAMETER RECORD.
            var results_sysparma1 = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + "ct_systemparameters" + "?$select=ct_name, ct_value&$filter=ct_systemparameterid eq " + 'BE46E31D-BFD0-E911-A82F-000D3A1780A6');
            if (results_sysparma1 != null) {
                for (var i = 0; i < results_sysparma1.value.length; i++) {
                    TeamId1 = results_sysparma1.value[i]["ct_value"];
                }
            }
            //GET "SECURITY TEAM Financial Advisor Relationship Manager (FARM)" CT_SYSTEMPARAMETER RECORD.
            var results_sysparma2 = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + "ct_systemparameters" + "?$select=ct_name, ct_value&$filter=ct_systemparameterid eq " + '0E161C6D-BFD0-E911-A82F-000D3A1780A6');
            if (results_sysparma2 != null) {
                for (var i = 0; i < results_sysparma2.value.length; i++) {
                    TeamId2 = results_sysparma2.value[i]["ct_value"];
                }
            }
            var result = QueryHelper.webApiRequest(QueryHelper.getWebApiUrl() + "systemusers(" + userID + ")?$select=address1_addressid&$expand=teammembership_association($select = name, teamid)");
            if (result != null) {
                for (var i = 0; i < result.teammembership_association.length; i++) {
                    var teamRole = result.teammembership_association[i]["teamid"];
                    if (teamRole.toLowerCase() == TeamId1.toLowerCase() || teamRole.toLowerCase() == TeamId2.toLowerCase()) {
                        return false;
                    }
                }
            }
            return true;
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "getTeamDetails");
            }
            return true;
        }
    }
    AccountForm.getTeamDetails = getTeamDetails;
    function DisplayPopupMessage() {
        if (FormScriptingHelper.getFieldValue(accountFields.ct_popupmessage) != null) {
            FormScriptingHelper.setFormNotification("INFO" /* XrmEnum.FormNotificationLevel.Info */, FormScriptingHelper.getFieldValue(accountFields.ct_popupmessage), accountFields.ct_popupmessage);
        }
    }
    AccountForm.DisplayPopupMessage = DisplayPopupMessage;
    function SetRequiredFields() {
        //FormScriptingHelper.makeFieldRequired(accountFields.ct_anniversarydate);
    }
    AccountForm.SetRequiredFields = SetRequiredFields;
    function emoneyid_OnChange() {
        try {
            if (FormScriptingHelper.getFieldValue(accountFields.ct_emoneyid) == null) {
                FormScriptingHelper.setDateField(accountFields.ct_emoneymatchdate, null);
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "emoneyid_OnChange");
            }
        }
    }
    AccountForm.emoneyid_OnChange = emoneyid_OnChange;
    function Clienttype_OnChange() {
        FormScriptingHelper.hideTab("tab_RecurringServices");
        if (FormScriptingHelper.getFieldValue(accountFields.ct_clienttype) == accountBooleanFields.ct_clienttype.Institutional) { //0=Institutional, 1=Individual
            FormScriptingHelper.showSection("SUMMARY_TAB", "INSTITUTIONAL_SECTION");
            FormScriptingHelper.showSection("SUMMARY_TAB", "ADDRESS");
            FormScriptingHelper.hideSection("SUMMARY_TAB", "WEALTH_SECTION");
            FormScriptingHelper.showTab("INSTITUTIONAL_TAB");
            FormScriptingHelper.hideField("ct_igo");
            FormScriptingHelper.showField(accountFields.ct_industry);
            FormScriptingHelper.showField(accountFields.ct_ctindustrydetails);
            if (FormScriptingHelper.getFormContext().ui.navigation.items.get("nav_ct_account_ct_solutionsrequest") != null) {
                FormScriptingHelper.getFormContext().ui.navigation.items.get("nav_ct_account_ct_solutionsrequest").setVisible(false);
            }
            else if (FormScriptingHelper.getFormContext().ui.navigation.items.get("navct_account_ct_solutionsrequest") != null) {
                FormScriptingHelper.getFormContext().ui.navigation.items.get("navct_account_ct_solutionsrequest").setVisible(false);
            }
        }
        else {
            FormScriptingHelper.hideSection("SUMMARY_TAB", "INSTITUTIONAL_SECTION");
            FormScriptingHelper.hideSection("SUMMARY_TAB", "ADDRESS");
            FormScriptingHelper.showSection("SUMMARY_TAB", "WEALTH_SECTION");
            FormScriptingHelper.hideTab("INSTITUTIONAL_TAB");
            FormScriptingHelper.showField("ct_igo");
            FormScriptingHelper.hideField(accountFields.ct_industry);
            FormScriptingHelper.hideField(accountFields.ct_ctindustrydetails);
            if (FormScriptingHelper.getFormContext().ui.navigation.items.get("nav_ct_account_ct_solutionsrequest") != null) {
                FormScriptingHelper.getFormContext().ui.navigation.items.get("nav_ct_account_ct_solutionsrequest").setVisible(true);
            }
            else if (FormScriptingHelper.getFormContext().ui.navigation.items.get("navct_account_ct_solutionsrequest") != null) {
                FormScriptingHelper.getFormContext().ui.navigation.items.get("navct_account_ct_solutionsrequest").setVisible(true);
            }
        }
        // Clear checkboxes
        if (isloading == true) {
            isloading = false;
        }
        else {
            FormScriptingHelper.setCheckboxValue(accountFields.ct_prodinvadvconsult, false);
            FormScriptingHelper.setCheckboxValue(accountFields.ct_prodvendoranalysis, false);
            FormScriptingHelper.setCheckboxValue(accountFields.ct_prodexecfinplan, false);
            FormScriptingHelper.setCheckboxValue(accountFields.ct_freedomoneflag, false);
            FormScriptingHelper.setCheckboxValue(accountFields.ct_prodparteducadvice, false);
            FormScriptingHelper.setCheckboxValue(accountFields.ct_prodfidprocessmgmt, false);
            FormScriptingHelper.setCheckboxValue(accountFields.ct_prodnonqualfinplan, false);
            FormScriptingHelper.setCheckboxValue(accountFields.ct_fundinggoals, false);
            FormScriptingHelper.setCheckboxValue(accountFields.ct_riskmanagement, false);
            FormScriptingHelper.setCheckboxValue(accountFields.ct_prodinvmgmt, false);
            FormScriptingHelper.setCheckboxValue(accountFields.ct_prodfinplan, false);
        }
        if (FormScriptingHelper.getFieldValue(accountFields.ct_clienttype) == accountBooleanFields.ct_clienttype.Institutional) {
            FormScriptingHelper.hideTab("tab_WealthView");
        }
        if (FormScriptingHelper.getFieldValue(accountFields.ct_clienttype) == accountBooleanFields.ct_clienttype.Individual) {
            FormScriptingHelper.hideField(accountFields.ct_prodinvadvconsult);
            FormScriptingHelper.hideField(accountFields.ct_prodvendoranalysis);
            FormScriptingHelper.hideField(accountFields.ct_prodexecfinplan);
            FormScriptingHelper.hideField(accountFields.ct_freedomoneflag);
            FormScriptingHelper.hideField(accountFields.ct_prodparteducadvice);
            FormScriptingHelper.hideField(accountFields.ct_prodfidprocessmgmt);
            FormScriptingHelper.hideField(accountFields.ct_prodnonqualfinplan);
            FormScriptingHelper.showField(accountFields.ct_fundinggoals);
            FormScriptingHelper.showField(accountFields.ct_riskmanagement);
            FormScriptingHelper.showField(accountFields.ct_prodinvmgmt);
            FormScriptingHelper.showField(accountFields.ct_prodfinplan);
            FormScriptingHelper.showTab("tab_WealthView");
            FormScriptingHelper.hideTab("tab_RecurringServices");
        }
        if ((FormScriptingHelper.getFormType() == 1 /* XrmEnum.FormType.Create */) &&
            (FormScriptingHelper.getFieldValue(accountFields.ct_clienttype) == accountBooleanFields.ct_clienttype.Individual)) {
            FormScriptingHelper.setCheckboxValue(accountFields.ct_prodinvmgmt, true);
            FormScriptingHelper.setCheckboxValue(accountFields.ct_prodfinplan, true);
        }
        // ShowMeetingFreqNextMeeting();
    }
    AccountForm.Clienttype_OnChange = Clienttype_OnChange;
    function HigherEducation_OnChange() {
        if (FormScriptingHelper.getFieldValue(accountFields.ct_highereducation) == true) {
            FormScriptingHelper.showField("ct_masteradministratorhighered");
            FormScriptingHelper.showField("ct_activeproviders");
            var options = FormScriptingHelper.getMultiOptionSetValue("ct_activeproviders");
            if (options !== null && options.filter(function (i) { return i.value === 206450012; }).length > 0) {
                FormScriptingHelper.showField("ct_otheractiveprovider");
            }
            else {
                FormScriptingHelper.hideField("ct_otheractiveprovider");
            }
            FormScriptingHelper.showField("ct_frozenproviders");
            var provideroptions = FormScriptingHelper.getFieldValue("ct_frozenproviders");
            if (FormScriptingHelper.getFieldValue("ct_frozenproviders") == true) {
                FormScriptingHelper.showField("ct_who");
                var frozenoptions = FormScriptingHelper.getMultiOptionSetValue("ct_who");
                if (frozenoptions !== null && frozenoptions.filter(function (i) { return i.value === 206450012; }).length > 0) {
                    FormScriptingHelper.showField("ct_otherfrozenprovider");
                }
                else {
                    FormScriptingHelper.hideField("ct_otherfrozenprovider");
                }
            }
            else {
                FormScriptingHelper.hideField("ct_who");
            }
        }
        else {
            FormScriptingHelper.hideField("ct_activeproviders");
            FormScriptingHelper.hideField("ct_masteradministratorhighered");
            FormScriptingHelper.hideField("ct_who");
            FormScriptingHelper.hideField("ct_otheractiveprovider");
            FormScriptingHelper.hideField("ct_otherfrozenprovider");
        }
    }
    AccountForm.HigherEducation_OnChange = HigherEducation_OnChange;
    //On state change
    function statecode_OnChange() {
        try {
            //move BPF to Lead when client is deactivated. Reactivate BPF is finished
            if (FormScriptingHelper.getSelectedOption(accountFields.statecode).value === accountOptions.AccountState.Inactive) {
                //Check if client has an active process.               
                if (FormScriptingHelper.getFormContext().data.process.getActivePath()) {
                    var leadStage_1 = FormScriptingHelper.getFormContext().data.process.getActivePath().get(0).getId();
                    var instanceid = FormScriptingHelper.getFormContext().data.process.getInstanceId(); // Get the current instance
                    if (FormScriptingHelper.getFormContext().data.process.getStatus() === "finished") {
                        //Reactivate the process
                        FormScriptingHelper.getFormContext().data.process.setStatus("active", function () { FormScriptingHelper.getFormContext().data.process.setActiveStage(leadStage_1); });
                    }
                    else {
                        //Move to lead stage
                        FormScriptingHelper.getFormContext().data.process.setActiveStage(leadStage_1);
                    }
                }
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "statecode_OnChange");
            }
        }
    }
    AccountForm.statecode_OnChange = statecode_OnChange;
    function ct_industry_OnChange(isonload) {
        try {
            var industrydetail = (FormScriptingHelper.getOptionSetValue(accountFields.ct_ctindustrydetails));
            var industry = (FormScriptingHelper.getOptionSetValue(accountFields.ct_industry));
            FormScriptingHelper.clearOptionSet(accountFields.ct_ctindustrydetails);
            switch (industry) {
                case accountOptions.ct_industry.Agriculture:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.FoodProduction);
                    break;
                case accountOptions.ct_industry.Arts_Entertainment__Recreation:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Leisure_Accommodations_Recreation);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.PublicInterest_Museums_PerformingArts);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Sports);
                    break;
                case accountOptions.ct_industry.Community_Faith:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.AnimalRights);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Civic_Social_CommunityOrg);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Civic_Social_CommunityOrgFoundation);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.CorporateFoundation);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Religious);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.SocialAssistance);
                    break;
                case accountOptions.ct_industry.Construction:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Construction_Commercial);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Construction_Residential);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ConstructionSupportServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Housing_HomeFurnishings);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.SpecialtyTradeContractors);
                    break;
                case accountOptions.ct_industry.Education:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.EducationalSupportServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.HigherEducation);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.K_12);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.PrivateK_12);
                    break;
                case accountOptions.ct_industry.Energy:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Energy);
                    break;
                case accountOptions.ct_industry.Finance:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Bank);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Conglomerate);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ConglomerateHoldingCompany);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.CreditUnions);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.FinancialRetailer);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.FinancialSupportServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Insurance);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Investment);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Investment_PrivateFamily);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Mortgage);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.PrivateTrust);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.RealEstate);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.RealEstateSupportServices);
                    break;
                case accountOptions.ct_industry.Government_Defense:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Defense_Industrial__CrisisResources);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.FederalOversight);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Gov_tContractorDefenseEngineering);
                    break;
                case accountOptions.ct_industry.Information:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Hardware_Networks_andSystems);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.IT_Software_andDevelopment);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Media_Publishing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.MotionPicture_Video);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Radio_Television);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Telecommunications);
                    break;
                case accountOptions.ct_industry.Manufacturing:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.AdvancedMaterialsManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Aerospace_TieredSuppliers);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.AluminumManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.AnimalFoodManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.AutomotiveManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.AVEquipmentManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Biotech);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Chemicals);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Clothing_JewelryManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.CommercialVehicle_SuppliersManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Concrete_CementManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Conglomerate_Manufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ConstructionMaterials);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ConsumerGoodsManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ElectronicsComponents_Assemblies);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.EngineeredMechanicalProductManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Engines_PowerSystems);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.FiberOptics);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Food_BeverageManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ForgingandStamping);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.FurnitureManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Health_BeautyManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.HealthcareProductManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.HomeApplianceManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.HVACAirflowManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.HygieneProductManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ImageCaptureManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.IndustrialCleaningMachinery);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.IronandSteelManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Lumber_WoodProductsManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.MachineShops);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.MachineryManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ManufacturingSupportMaterials);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ManufacturingSupportServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Measurements_Controls);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.MetalManufacturingSupport);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.MetalProducts);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.MetalTreatment_Finishing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.OutdoorEquipmentManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.PackagingManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Paper_PrintingManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Pharma);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.PharmaSupportService);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Piping_RubberProducts);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Plastics_Moldables);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ProcessAutomationManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Railroad_Suppliers);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.RecreationalVehicleManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.RetailEnvironmentManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.SafetyProductManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Self_Defense_SecurityProductManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.SpringandWireProducts);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.TextileManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ThermalSolutionsManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ToolManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.UtilitySupportManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.WindowsManufacturing);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Wire_CableManufacturing);
                    break;
                case accountOptions.ct_industry.Mining:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Mining);
                    break;
                case accountOptions.ct_industry.Professional_IndustryOrganizations:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ProfessionalindustryOrg);
                    break;
                case accountOptions.ct_industry.ProfessionalServices:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Accountants);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.AnimalCare);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ArchitecturalServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.BusinessOpsServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Commerce_TradeSupport);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.DataAnalysis_Consulting);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.EmploymentServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.EngineeringServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.EnvironmentalManagement);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.HRSupportServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Legal);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.LegalSupportServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Marketing_PR__CreativeConsulting);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Research_Analysis);
                    break;
                case accountOptions.ct_industry.Public:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Municipality);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.MunicipalitySupportServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Thinktank_PublicPolicy_andAdvocacy);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Utilities);
                    break;
                case accountOptions.ct_industry.Retail:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Automotive);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Clothing_Jewelry);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Food_Beverage);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Food_BeverageRetail);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.FuelDealers_ConvenienceStores);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.RecreationalVehicleSales);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.RetailFunerals_Cemeteries);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.RetailSupportServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.SpecialtyRetailer);
                    break;
                case accountOptions.ct_industry.Safety_Security:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.SecurityServices);
                    break;
                case accountOptions.ct_industry.Shipping_Storage:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Shipping);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Transportation_air);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Transportation_logistics);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Transportation_rail);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Transportation_resourcessupport);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Transportation_taxi_electric_flying);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Transportation_terminal);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Transportation_transitsystem);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Transportation_trucking);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Transportation_water);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Warehousing_ColdStorage);
                    break;
                case accountOptions.ct_industry.Unions:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Union);
                    break;
                case accountOptions.ct_industry.Unknown:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Unknown);
                    break;
                case accountOptions.ct_industry.Wellness:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Counseling_TherapyServices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Dentists);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.HealthcareAuxiliarySupport);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.HealthcareFoundation);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.HealthcareResearch);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Hospitals_HealthcareSystems);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.MedicalPractices);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Nursing_ResidentialCareFacilities);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Wellness_HealthcareAdvocacy);
                    break;
                case accountOptions.ct_industry.Wholesale:
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Food_BeverageWhsl);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.ITwholesaler);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.Machinery_Equipment);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.OfficeSolutions);
                    FormScriptingHelper.addOptionbyValue(accountFields.ct_ctindustrydetails, accountOptions.ct_ctindustrydetails.SpecialtyWholesaler);
                    break;
                default:
                    FormScriptingHelper.clearOptionSet(accountFields.ct_ctindustrydetails);
                    break;
            }
            if (isonload && industrydetail != null) {
                FormScriptingHelper.setOptionSetValue(accountFields.ct_ctindustrydetails, industrydetail, true);
            }
            else {
                FormScriptingHelper.setOptionSetValue(accountFields.ct_ctindustrydetails, null, true);
            }
        }
        catch (err) {
            if (typeof LogHelper.logUiException === "function") {
                LogHelper.logUiException(err, "ct_retirementyear_OnChange");
            }
        }
    }
    AccountForm.ct_industry_OnChange = ct_industry_OnChange;
})(AccountForm || (AccountForm = {}));
//This is being used for the institutional and client  ct_clienttype to make it more readable
var accountBooleanFields;
(function (accountBooleanFields) {
    var ct_clienttype;
    (function (ct_clienttype) {
        ct_clienttype[ct_clienttype["Institutional"] = 0] = "Institutional";
        ct_clienttype[ct_clienttype["Individual"] = 1] = "Individual";
    })(ct_clienttype = accountBooleanFields.ct_clienttype || (accountBooleanFields.ct_clienttype = {}));
    accountBooleanFields.ct_clienttypeMap = {};
    accountBooleanFields.ct_clienttypeMap[ct_clienttype.Institutional] = "Institutional";
    accountBooleanFields.ct_clienttypeMap[ct_clienttype.Individual] = "Individual";
})(accountBooleanFields || (accountBooleanFields = {}));

//# sourceMappingURL=AccountForm.js.map


