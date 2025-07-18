# Complete Field Listing for Leads and Calls Modules

## 📊 **Module Field Analysis Summary**

Successfully retrieved all fields from both **Leads** and **Calls** modules using the MCP tools.

---

## 🎯 **LEADS Module Fields**

### **Core Lead Information Fields:**
- **Lead Owner** (`Lead_Owner`) - Owner lookup field
- **Lead Source** (`Lead_Source`) - Picklist with 12 values including Developer, Brokers, Referral, etc.
- **Lead Status** (`Lead_Status`) - Picklist with 9 values including New Lead, Interested, Not Connected, etc.
- **Company** (`Company`) - Text field
- **First Name** (`First_Name`) - Text field
- **Last Name** (`Last_Name`) - Text field
- **Email** (`Email`) - Email field
- **Phone** (`Phone`) - Phone field
- **Mobile** (`Mobile`) - Phone field
- **Website** (`Website`) - Website field

### **Address Fields:**
- **Street** (`Street`) - Text field
- **City** (`City`) - Text field
- **State** (`State`) - Text field
- **Zip Code** (`Zip_Code`) - Text field
- **Country** (`Country`) - Text field

### **Custom Fields with Picklist Values:**
- **Enrich Status** (`Enrich_Status__s`) - Picklist: "Available", "Enriched", "Data not found"
- **Reason For Future Lead** (`Reason_For_Future_Lead`) - Picklist: "-None-", "Budget Issue", "Shop renovation", "Other"
- **Reason For Not Connected** (`Reason_For_Not_Connected`) - Picklist: "-None-", "Busy", "No Answer", "Not Reachable", "Switch Off"
- **Reason For Not Interested** (`Reason_For_Not_Interested`) - Picklist: "-None-", "Budget Issue", "Competitor Pitch"
- **Record Status** (`Record_Status__s`) - Picklist: "Trash", "Available", "Draft"

### **System Fields:**
- **Created By** (`Created_By`) - Owner lookup
- **Modified By** (`Modified_By`) - Owner lookup
- **Created Time** (`Created_Time`) - DateTime
- **Modified Time** (`Modified_Time`) - DateTime
- **Record Id** (`id`) - Bigint (system field)

---

## 📞 **CALLS Module Fields**

### **Core Call Information Fields:**
- **Subject** (`Subject`) - Text field (system mandatory)
- **Call Purpose** (`Call_Purpose`) - Picklist with 7 values:
  - "-None-"
  - "Prospecting"
  - "Administrative"
  - "Negotiation"
  - "Demo"
  - "Project"
  - "Desk" (Support)

### **Contact and Related Fields:**
- **Contact Name** (`Who_Id`) - Lookup to Contacts module
- **Related To** (`What_Id`) - Lookup to various modules (se_module)

### **Call Details:**
- **Call Start Time** (`Call_Start_Time`) - DateTime (system mandatory)
- **Call Duration** (`Call_Duration`) - Text field (system mandatory)
- **Call Duration (in seconds)** (`Call_Duration_in_seconds`) - Integer field
- **Description** (`Description`) - Textarea field
- **Call Result** (`Call_Result`) - Picklist with 7 values:
  - "-None-"
  - "Interested"
  - "Not interested"
  - "No response/Busy"
  - "Requested more info"
  - "Requested call back"
  - "Invalid number"

### **Call Management:**
- **Call Agenda** (`Call_Agenda`) - Text field
- **Reminder** (`Reminder`) - Picklist with 8 values:
  - "None"
  - "5 minutes before"
  - "10 minutes before"
  - "15 minutes before"
  - "30 minutes before"
  - "1 hour before"
  - "2 hours before"
  - "1 day before"
  - "2 days before"

### **Call Status and Tracking:**
- **Outgoing Call Status** (`Outgoing_Call_Status`) - Picklist with 5 values:
  - "-None-"
  - "Scheduled"
  - "Completed"
  - "Overdue"
  - "Cancelled"
- **Scheduled in CRM** (`Scheduled_In_CRM`) - Picklist: "False", "True"

### **System and Technical Fields:**
- **CTI Entry** (`CTI_Entry`) - Boolean field
- **Caller ID** (`Caller_ID`) - Text field (read-only)
- **Dialled Number** (`Dialled_Number`) - Text field (read-only)
- **Voice Recording** (`Voice_Recording__s`) - Website field
- **Record Status** (`Record_Status__s`) - Picklist: "Trash", "Available", "Draft"
- **Last Activity Time** (`Last_Activity_Time`) - DateTime field

### **System Fields:**
- **Created By** (`Created_By`) - Owner lookup
- **Modified By** (`Modified_By`) - Owner lookup
- **Created Time** (`Created_Time`) - DateTime
- **Modified Time** (`Modified_Time`) - DateTime
- **Record Id** (`id`) - Bigint (system field)
- **Tag** (`Tag`) - Text array field

---

## 🔍 **Key Observations:**

### **Picklist Fields Analysis:**
1. **Leads Module** has 5 picklist fields with dependency potential
2. **Calls Module** has 4 picklist fields with dependency potential

### **Field Types Distribution:**
- **Text Fields**: Most common (names, addresses, descriptions)
- **Picklist Fields**: Used for categorization and status tracking
- **Lookup Fields**: Connect to other modules (Contacts, Accounts)
- **DateTime Fields**: Track timing and scheduling
- **System Fields**: Metadata and tracking

### **Dependency Potential:**
- **Lead Status** → **Call Purpose** (potential relationship)
- **Call Result** → **Follow-up actions** (potential workflow)
- **Outgoing Call Status** → **Call scheduling** (direct relationship)

### **Mandatory Fields:**
- **Leads**: Subject (system mandatory)
- **Calls**: Subject, Call Start Time, Call Duration (system mandatory)

---

## 📈 **Usage Insights:**

### **For Lead Management:**
- Use **Lead Status** and **Lead Source** for categorization
- Track **Enrich Status** for data quality
- Monitor **Reason fields** for conversion analysis

### **For Call Management:**
- Use **Call Purpose** for activity categorization
- Track **Call Result** for outcome analysis
- Monitor **Outgoing Call Status** for scheduling management

### **For Integration:**
- **Who_Id** connects calls to contacts
- **What_Id** connects calls to various modules
- **Tag** field allows for flexible categorization

---

*Data retrieved using MCP tools: `crm_get_module_fields` for both Leads and Calls modules.* 