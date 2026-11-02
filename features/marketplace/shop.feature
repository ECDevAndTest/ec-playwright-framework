# Unscripted until steps/marketplace has step bodies.
# The marketplace project stays out of the default run until MARKETPLACE_BASE_URL is set.
@unscripted
Feature: US storefront cart

  Scenario: Add the Black backpack to the cart
    Given the visitor opens the US shop
    Then the shop shows "Playwright Test Backpack"
    When the visitor adds the "Black" variant to the cart
    Then the cart contains the "Black" variant
