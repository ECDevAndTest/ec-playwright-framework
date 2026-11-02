# Unscripted until steps/admin has step bodies.
# These scenarios must not delete pw-test-backpack or the United States region.
@unscripted
Feature: Hosted admin catalog

  Scenario: Find the Playwright backpack in the product list
    Given the hosted admin is logged in
    When the admin opens the product list
    Then the product list shows "Playwright Test Backpack"

  Scenario: See the United States region
    Given the hosted admin is logged in
    When the admin opens regions
    Then the region list shows "United States"
