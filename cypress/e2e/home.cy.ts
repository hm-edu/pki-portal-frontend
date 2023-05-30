describe("home", () => {

    it("home loggedout mobile", () => {
        cy.visit("/");
        cy.get(".MuiButton-outlined").should("be.visible").and("contain", "Anmelden");
    });
    it("home loggedout", () => {
        cy.viewport(1280, 1024);
        cy.visit("/");
        cy.get(".MuiButton-outlined").should("be.visible").and("contain", "Anmelden");
    });
    it("home loggedin mobile", () => {
        cy.viewport(800, 600);
        cy.login().as("getSession");
        cy.visit("/");
        cy.wait("@getSession");
        cy.get(".MuiButton-outlined").should("be.visible").and("contain", "Abmelden");
    });
    it("home loggedin", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.visit("/");
        cy.wait("@getSession");
        cy.get(".MuiButton-outlined").should("be.visible").and("contain", "Abmelden");
    });
});
