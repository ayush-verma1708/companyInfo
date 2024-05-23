import * as React from 'react';
import type { ICompanyInfoProps } from './ICompanyInfoProps';
import { getSP } from "./Spfx_sp.config";
import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";

export default class CompanyInfo extends React.Component<ICompanyInfoProps, { shortlistedCompanies: any[] }> {
private _sp: SPFI;

constructor(props: ICompanyInfoProps) {
super(props);
this.state = { shortlistedCompanies: [] };
this._sp = getSP();
}

componentDidMount() {
this.getCompanyInfo();
this.getShortlistedCompanies();
}

private getCompanyInfo = async () => {
 const pageTitle = document.title;
// const pageTitle = "Skillskonnect";
 if (!pageTitle.trim()) {
   console.error("Page title is blank.");
   alert("Page title is blank. Please set a title for the page.");
   return;
 }
try {
const uni: any[] = await this._sp.web.lists
.getByTitle("CompanyData")
.items.filter(`Title eq '${pageTitle}'`)
.select(
"ID",
"Title",
"CountryOfOrigin",
"PreviousFunding",
"VisionStatement",
"EmployeeCount",
"Investments",
"SeedInvestment",
"PotentialInvestorForm",
"RevenueGenerated",
"CompanyWebsite",
)();

if (uni.length > 0) {
let html = `
<div style="margin-bottom: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
<h2>${uni[0].Title}</h2>
<table style="width: 100%; border-collapse: collapse;">
`;
const displayElements = [
  "CountryOfOrigin",
"PreviousFunding",
"VisionStatement",
"Investments",
"SeedInvestment",
// "PotentialInvestorForm",
"RevenueGenerated",
"CompanyWebsite",
];
displayElements.forEach(element => {
if (uni[0].hasOwnProperty(element)) {
let value = uni[0][element];
if (value === undefined || value === null) {
value = "NA";
}
html += `<tr style="border-bottom: 1px solid #ddd;">
<td style="padding: 8px; text-align: left;"><strong>${element}</strong></td>
<td style="padding: 8px; text-align: left;">${value}</td>
</tr>`;
}
});
html += `</table>`;

const allItemsElement = document.getElementById("allItems");

if (allItemsElement) {
allItemsElement.innerHTML = html;

// Add a button for PotentialInvestorForm
const PotentialInvestorFormLink = uni[0]["PotentialInvestorForm"];
if (PotentialInvestorFormLink) {
const hasShortlisted = await this.hasShortlistedCompany(uni[0].Title);
if (hasShortlisted) {
const buttonHtml = `<button onclick="window.open('${PotentialInvestorFormLink}', '_blank')" style="margin-top: 10px; padding: 8px 16px; background-color: #007bff; color: #fff; border: none; border-radius: 5px; cursor: pointer;">Investor Form</button>`;
allItemsElement.innerHTML += buttonHtml;
}
} else {
console.error("PotentialInvestorForm link not found.");
}

if (!allItemsElement.querySelector(".shortlistButton")) {
const addButton = document.createElement("button");
addButton.textContent = "Add to Shortlisted";
addButton.className = "shortlistButton";
addButton.style.marginTop = "10px";
addButton.style.padding = "8px 16px";
addButton.style.backgroundColor = "#28a745";
addButton.style.color = "#fff";
addButton.style.border = "none";
addButton.style.borderRadius = "5px";
addButton.style.cursor = "pointer";
addButton.addEventListener("click", () => this.addToShortlisted(uni[0].Title, uni[0]));
allItemsElement.appendChild(addButton);
}

} else {
console.error("Element with id 'allItems' not found.");
}
} else {
alert(`No data found for the selected Company.`);
}
} catch (error) {
console.error("An error occurred while fetching the item:", error);
alert("An error occurred while fetching the items.");
}
};


private getShortlistedCompanies = async () => {
try {
const user = await this._sp.web.currentUser();
const loginName = user.Title;
const shortlistedCompanies: any[] = await this._sp.web.lists.getByTitle("Shortlisted").items
.select("ID", "Title", "Company", "username")
.filter(`username eq '${loginName}'`)
();

this.setState({ shortlistedCompanies });
} catch (error) {
console.error("An error occurred while fetching the shortlisted Companies:", error);
}
};

//@ts-ignore
private async getApplicationDateForCompany(title: string): Promise<string | null> {
try {
const uni: any[] = await this._sp.web.lists
.getByTitle("Company")
.items.filter(`Title eq '${title}'`)
.select("ApplicationDates")();

if (uni.length > 0) {
return uni[0]["ApplicationDates"] || null;
}
return null;
} catch (error) {
console.error("An error occurred while fetching the application date:", error);
return null;
}
}

//@ts-ignore
private async getMyAdmissionSafeDateForCompany(title: string): Promise<string | null> {
  try {
  const uni: any[] = await this._sp.web.lists
  .getByTitle("Company")
  .items.filter(`Title eq '${title}'`)
  .select("MyAdmissionSafeDate")();
  
  if (uni.length > 0) {
  return uni[0]["MyAdmissionSafeDate"] || null;
  }
  return null;
  } catch (error) {
  console.error("An error occurred while fetching the application date:", error);
  return null;
  }
  }

private addToShortlisted = async (title: string, uni: any) => {
try {
const user = await this._sp.web.currentUser();
const loginName = user.Title;
const date = this.getCurrentDate();
const MyItemUniq = `${loginName}${date}${title}`;
const email = user.Email;

// Check if the Company is already shortlisted
const isShortlisted = await this.checkIfShortlisted(loginName, title);
if (isShortlisted) {
alert(`Company ${title} is already shortlisted.`);
return;
}

// // Fetch the ApplicationDate for the Company
// const applicationDate = await this.getApplicationDateForCompany(title);
// const MyAdmissionSafeDate = await this.getMyAdmissionSafeDateForCompany(title);

await this._sp.web.lists.getByTitle("Shortlisted").items.add({
  Title: `${loginName}${title}`,
  Company: title,
  MyItemUniq: MyItemUniq,
  username: loginName,
  Date: date,
  FormInfo:'No',
// ApplicationDate: applicationDate, // Add ApplicationDate to the Shortlisted list
// MyAdmissionSafeDate: MyAdmissionSafeDate, // Add MyAdmissionSafeDate to the Shortlisted list
EmailID : email,
});

alert(`Company ${title} added to Shortlisted successfully.`);
this.getCompanyInfo();
this.getShortlistedCompanies();
} catch (error) {
console.error("An error occurred while adding the Company to Shortlisted:", error);
alert("An error occurred while adding the Company to Shortlisted.");
}
};


private async hasShortlistedCompany(title: string): Promise<boolean> {
try {
const user = await this._sp.web.currentUser();
const loginName = user.Title;

const result = await this._sp.web.lists.getByTitle("Shortlisted").items
.filter(`Company eq '${title}' and username eq '${loginName}'`)
();

return result.length > 0;
} catch (error) {
console.error("Error checking if the Company is shortlisted:", error);
return false;
}
}

private checkIfShortlisted = async (username: string, Company: string): Promise<boolean> => {
const result = await this._sp.web.lists.getByTitle("Shortlisted")
.items.filter(`username eq '${username}' and Company eq '${Company}'`)
.select("ID")
();

return result.length > 0;
};

private getCurrentDate = () => {
const date = new Date();
return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

private deleteFromShortlisted = async (id: number) => {
try {
await this._sp.web.lists.getByTitle("Shortlisted").items.getById(id).delete();
alert("Company removed from Shortlisted successfully.");
this.getCompanyInfo();
this.getShortlistedCompanies(); // Refresh the shortlisted Companies list
} catch (error) {
console.error("An error occurred while deleting the Company from Shortlisted:", error);
alert("An error occurred while deleting the Company from Shortlisted.");
}
};

public renderShortlistedCompanies = () => {
return (
<div>
<h2>Shortlisted Companies</h2>
{this.state.shortlistedCompanies.map((uni) => (
<div key={uni.ID} style={{ marginBottom: '10px' }}>
<p>{uni.Title}</p>
<button
style={{
padding: '5px 10px',
backgroundColor: '#f44336',
color: 'white',
border: 'none',
borderRadius: '5px',
cursor: 'pointer',
}}
onClick={() => this.deleteFromShortlisted(uni.ID)}
>
Delete
</button>
</div>
))}
</div>
);
};

public render(): React.ReactElement<ICompanyInfoProps> {
return (
<div>
<h1>{document.title}</h1> {/* Display the page title */}
<div id="allItems"></div> {/* Display Company information here */}
{this.renderShortlistedCompanies()}
</div>
);
}
}

