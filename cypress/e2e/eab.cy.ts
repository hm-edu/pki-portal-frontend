describe("eab", () => {
    it("eab loggedout", () => {
        cy.viewport(1280, 1024);
        cy.visit("/eab");
        cy.reload();
        cy.get(".MuiButton-outlined").should("be.visible").and("contain", "Anmelden");
        cy.get(".MuiAlert-message").should("be.visible").and("contain", "Bitte melden Sie sich an!");
        cy.get("#newServer").should("not.exist");
    });
    it("eab loggedin empty", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.intercept("https://eab.api.example.edu/eab/", {
            statusCode: 200,
        }).as("getEab");
        cy.visit("/eab");
        cy.reload();
        cy.wait(["@getSession", "@getEab"]);
        cy.get("#new").should("be.visible");
        cy.get(".MuiDataGrid-overlay").should("be.visible").and("contain", "Keine Einträge");
    });
    it("eab loggedin load & delete", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.intercept("https://eab.api.example.edu/eab/", {
            statusCode: 200,
            body: [{ "id":"Test","key_bytes":"","bound_at":"2022-11-01T07:30:57.615887734Z","comment":"test.hm.edu" }],
        }).as("getEab");
        cy.visit("/eab");
        cy.reload();
        cy.wait(["@getSession", "@getEab"]);
        cy.get("#new").should("be.visible");
        cy.get(".MuiDataGrid-cell--withRenderer.MuiDataGrid-cell--textLeft > .MuiButtonBase-root").click();
        cy.get("#toBeDeleted").should("be.visible");
    });
    it("eab loggedin error loading", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.intercept("https://eab.api.example.edu/eab/", {
            statusCode: 500,
        }).as("getEab");
        cy.visit("/eab");
        cy.reload();
        cy.wait(["@getSession", "@getEab"]);
        cy.get(".MuiAlert-message").should("be.visible").and("contain", "Ein unerwarteter Fehler ist aufgetreten.");
        cy.get("#new").should("not.exist");
    });
});
