describe("new user", () => {
    it("new user loggedout", () => {
        cy.viewport(1280, 1024);
        cy.intercept("/api/auth/session", {
            statusCode: 401,
        }).as("getSession");
        cy.visit("/user/new");
        cy.get(".MuiButton-outlined").should("be.visible").and("contain", "Anmelden");
        cy.wait("@getSession");
        cy.get(".MuiAlert-message").should("be.visible").and("contain", "Sie sind nicht angemeldet!");
    });
    it("new user loggedin", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.visit("/user/new");
        cy.get(".MuiButton-outlined").should("be.visible").and("contain", "Anmelden");
        cy.wait(["@getSession"]);
        cy.get("#generate").should("be.visible").and("be.disabled");
        cy.get("#validation").should("be.visible");
        cy.get("#revoke").should("not.exist");
        cy.get("#pkcs12").type("test");
        cy.get("#validation").should("be.visible");
        cy.get("#pkcs12validation").type("test");
        cy.get("#validation").should("be.visible");
        cy.get("#pkcs12").type("test1234");
        cy.get("#pkcs12validation").type("test1234");
        cy.get("#validation").should("not.exist");

    });
});
describe("user", () => {
    it("user loggedout", () => {
        cy.viewport(1280, 1024);
        cy.visit("/user");
        cy.get(".MuiButton-outlined").should("be.visible").and("contain", "Anmelden");
        cy.get(".MuiAlert-message").should("be.visible").and("contain", "Bitte melden Sie sich an!");
        cy.get("#new").should("not.exist");
    });
    it("user loggedin empty", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.intercept("https://pki.api.hm.edu/smime/?email=max%40mustermann.de", {
            statusCode: 200,
        }).as("getUser");
        cy.visit("/user");
        cy.wait(["@getSession", "@getUser"]);
        cy.get("#new").should("be.visible");
        cy.get(".MuiDataGrid-overlay").should("be.visible").and("contain", "Keine Einträge");
    });
    it("user loggedin error loading", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.intercept("https://pki.api.hm.edu/smime/?email=max%40mustermann.de", {
            statusCode: 500,
        }).as("getUser");
        cy.visit("/user");
        cy.wait(["@getSession", "@getUser"]);
        cy.get(".MuiAlert-message").should("be.visible").and("contain", "Ein unerwarteter Fehler ist aufgetreten.");
        cy.get("#new").should("not.exist");
    });
});
