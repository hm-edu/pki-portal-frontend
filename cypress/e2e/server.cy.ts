describe("server", () => {
    it("server loggedout", () => {
        cy.viewport(1280, 1024);
        cy.visit("/server");
        cy.get(".MuiButton-outlined").should("be.visible").and("contain", "Anmelden");
        cy.get(".MuiAlert-message").should("be.visible").and("contain", "Bitte melden Sie sich an!");
        cy.get("#newServer").should("not.exist");
    });
    it("server loggedin empty", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.intercept("https://pki.api.hm.edu/ssl/", {
            statusCode: 200,
        }).as("getSsl");
        cy.visit("/server");
        cy.wait(["@getSession", "@getSsl"]);
        cy.get("#newServer").should("be.visible");
        cy.get(".MuiDataGrid-overlay").should("be.visible").and("contain", "Keine Einträge");
    });
    it("server loggedin content", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.intercept("https://pki.api.hm.edu/ssl/", {
            statusCode: 200,
            body: [
                {
                    "id": 7836658,
                    "common_name": "test.ee.hm.edu",
                    "status": "Issued",
                    "serial": "test",
                    "subject_alternative_names": [
                        "test.ee.hm.edu"
                    ],
                    "expires": {
                        "seconds": 1736121599
                    },
                    "not_before": {
                        "seconds": 1704499200
                    },
                    "issued_by": "Test",
                    "created": {
                        "seconds": 1704582046,
                        "nanos": 151014000
                    },
                    "source": "ACME",
                    "db_id": 1360,
                    "ca": "sectigo"
                }
            ]
        }).as("getSsl");
        cy.visit("/server");
        cy.wait(["@getSession", "@getSsl"]);
        cy.get("#newServer").should("be.visible");
        cy.get('.MuiDataGrid-row--lastVisible > [data-field="common_name"]').should('contain', 'test.ee.hm.edu');
    });
    it("server loggedin error loading", () => {
        cy.viewport(1280, 1024);
        cy.login().as("getSession");
        cy.intercept("https://pki.api.hm.edu/ssl/", {
            statusCode: 500,
        }).as("getSsl");
        cy.visit("/server");
        cy.wait(["@getSession", "@getSsl"]);
        cy.get(".MuiAlert-message").should("be.visible").and("contain", "Ein unerwarteter Fehler ist aufgetreten.");
        cy.get("#newServer").should("not.exist");
    });
});
