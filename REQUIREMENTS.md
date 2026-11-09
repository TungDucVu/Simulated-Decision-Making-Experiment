# Build a Simulated Decision-Making Experiment Web Application

Develop a complete, interactive web application to conduct a controlled behavioural experiment investigating the effect of a 10-second decision-making pause on the quality of participants' decisions.

The experiment must be delivered through a simulated web interface. Participants will be randomly assigned to one of two experimental conditions:

1. **Experimental Group (10-Second Pause):** Participants must wait for 10 seconds before they can confirm their decision. During this period, they are prompted to review the important information presented on the screen.
2. **Control Group (Immediate Confirmation):** Participants see an identical interface, but their confirmation button is active immediately, allowing them to proceed without waiting.

The experiment consists of three independent decision-making tasks:
- Consumer Price and Value Comparison
- App Permission and Privacy Decision
- Subscription Decision with Auto-Renewal Terms

## 1. Overall Application Structure

Build the application as a sequence of screens with a clean, professional, realistic web interface.

The application should contain the following stages:

1. Welcome and introduction screen.
2. Participant instructions.
3. Experimental group assignment.
4. Decision-making Task 1: Consumer Price/Value Comparison.
5. Decision-making Task 2: App Permission/Privacy Decision.
6. Decision-making Task 3: Subscription and Auto-Renewal Decision.
7. Final questionnaire.
8. Completion and thank-you screen.

Use a consistent visual design throughout the experiment. The interface should resemble a real e-commerce or consumer application rather than an academic questionnaire.

## 2. Participant Assignment

Randomly assign each participant to one of two conditions when they begin the experiment.

Store the assigned condition throughout the session so that participants remain in the same group for all three tasks.

The assignment must be balanced as far as reasonably possible across participants. If a backend is available, implement server-side assignment and persist the allocation. Otherwise, implement a clearly documented session-based random assignment.

Do not reveal the experimental hypothesis or explicitly tell participants that they are being tested on impulsive decision-making.

## 3. Experimental Condition: 10-Second Pause

For participants assigned to the experimental group, implement the following behaviour on all three decision screens:

- Display the decision information and available options.
- Display a visible countdown timer starting at 10 seconds.
- Display a message such as:

  "Take a moment to review the key information before confirming your decision."

- Display a confirmation button that remains disabled throughout the countdown.
- Update the timer every second: 10, 9, 8 ... 1.
- Once the countdown reaches zero, enable the confirmation button.
- Change the button appearance to indicate that it is now active.
- Participants can then confirm their selected option.

Important:
- The countdown must not be skippable.
- Refreshing the page must not reset the countdown to provide additional or reduced waiting time.
- The selected decision should remain unchanged during the waiting period.
- Participants should be able to review the information while waiting.
- The countdown should be applied independently to each of the three decision tasks.

## 4. Control Condition: Immediate Confirmation

Participants assigned to the control group should see the exact same decision screens, information, options, and layout.

However:
- The confirmation button must be active immediately.
- No countdown should be displayed.
- No forced waiting period should be implemented.
- Participants should be able to select an option and confirm immediately.

Keep all other interface elements identical between the two conditions. The only intended difference should be the presence or absence of the 10-second pause mechanism.

## 5. Decision Task 1: Consumer Price and Value Comparison

Create a simulated online shopping scenario.

Scenario:

"The participant wants to purchase a pair of wireless headphones and is presented with three purchasing options."

Display three product cards with realistic product descriptions, prices, and features.

Example:

Product A:
- Price: ₹1,499
- Battery Life: 20 hours
- Noise Cancellation: No
- Warranty: 6 months

Product B:
- Price: ₹2,499
- Battery Life: 35 hours
- Noise Cancellation: Yes
- Warranty: 1 year

Product C:
- Price: ₹1,999
- Battery Life: 30 hours
- Noise Cancellation: No
- Warranty: 1 year

Allow participants to select one product.

After selection, display the confirmation button according to their assigned experimental condition.

Record:
- Selected product.
- Product price.
- Time taken to make the selection.
- Time taken to confirm the selection.
- Whether the participant changed their selection.
- Assigned experimental condition.

The objective is to observe whether the decision-making pause influences participants' price-value evaluations and purchasing choices.

## 6. Decision Task 2: App Permission and Privacy Decision

Create a simulated mobile application permission request.

Scenario:

"The participant has downloaded a new lifestyle application that offers personalised recommendations and activity tracking."

Display an application permission request with the following information:

Application: FitLife

Requested permissions:
- Location access (including background location).
- Contact access.
- Activity and fitness data.
- Notification access.

Explain briefly why the application requests these permissions and what functionality participants receive by granting them.

Provide three possible decisions:

1. Allow All Permissions.
2. Allow Only Essential Permissions.
3. Deny Permissions.

Include a short privacy disclosure explaining that some permissions may involve sharing personal information with third-party service providers.

Make the interface resemble a genuine mobile application permission screen.

After participants select an option, apply the assigned confirmation mechanism.

Record:
- Selected permission option.
- Number of permissions accepted.
- Whether background location was granted.
- Whether the participant changed their selection.
- Decision time.
- Confirmation time.
- Assigned experimental condition.

The objective is to examine whether the pause influences participants' willingness to grant potentially sensitive permissions.

## 7. Decision Task 3: Subscription and Auto-Renewal Decision

Create a simulated subscription purchase screen.

Scenario:

"The participant is considering subscribing to a premium entertainment and productivity service."

Display the following subscription information:

Plan: Premium Membership

- Introductory price: ₹99 for the first month.
- Regular price after the introductory period: ₹499/month.
- Subscription automatically renews every month.
- Payment method is charged automatically.
- Cancellation is possible through account settings.
- The participant must cancel before the next billing date to avoid the next charge.

Make the auto-renewal condition visible but ensure it appears in a realistic subscription interface.

Provide three options:

1. Start Free/Introductory Offer.
2. Choose Monthly Subscription.
3. Do Not Subscribe.

The confirmation button must follow the participant's assigned experimental condition.

Record:
- Selected subscription option.
- Whether the participant accepted an auto-renewing plan.
- Whether they noticed the recurring payment term, if measured separately.
- Decision time.
- Confirmation time.
- Assigned experimental condition.

The objective is to investigate whether a forced pause increases attention to recurring payment obligations and influences subscription decisions.

## 8. Timing and Behavioural Data Collection

Implement accurate event tracking for every participant.

For each decision task, collect:

- Anonymous participant ID.
- Experimental group assignment.
- Task identifier.
- Task start timestamp.
- First selection timestamp.
- Final selection timestamp.
- Confirmation timestamp.
- Total decision-making time.
- Whether the participant changed their selection.
- Initial and final selections.
- Countdown completion status, where applicable.

Measure decision time separately from the imposed 10-second waiting period. This is particularly important when comparing the two experimental groups.

Store all data in a structured format, preferably in a database or downloadable CSV/JSON file.

Do not collect unnecessary personally identifiable information.

## 9. Final Questionnaire

After all three tasks, present a short questionnaire containing:

1. How carefully did you consider the information before making your decisions?
2. Did you notice the important terms and conditions presented on the screens?
3. How confident are you about the decisions you made?
4. Did you feel rushed while making any of the decisions?
5. Did you notice the recurring payment condition in the subscription task?
6. Did you find any of the decisions difficult?

Use a five-point Likert scale where appropriate:
- Strongly Disagree
- Disagree
- Neutral
- Agree
- Strongly Agree

Include an optional feedback field.

## 10. User Interface and Design Requirements

The interface should be modern, minimal, and realistic.

Design requirements:
- Responsive layout for desktop and mobile.
- Clear typography and consistent spacing.
- Realistic shopping product cards.
- Realistic app permission interface.
- Realistic subscription pricing interface.
- Clearly visible selection states.
- Smooth transitions between tasks.
- Progress indicator showing Task 1 of 3, Task 2 of 3, etc.
- Accessible buttons and readable text.
- Consistent colour scheme.

For the experimental group, make the countdown visible without making it overly distracting.

For the control group, ensure there is no countdown or visual indication that a waiting period exists.

## 11. Research Integrity and Experimental Consistency

This is a controlled experiment, so maintaining consistency between the two groups is essential.

Ensure:
- Both groups receive identical information.
- Both groups receive identical decision options.
- Both groups see identical product descriptions and pricing.
- The only experimental manipulation is the 10-second confirmation delay.
- The order of the three tasks remains consistent across groups.
- Participants cannot skip tasks.
- All decisions are recorded before moving to the next task.
- Participants cannot change previously confirmed decisions.

Do not introduce additional differences in wording, layout, colours, or instructions between the two conditions.

## 12. Admin and Data Export

Create a basic administrator dashboard that allows the researcher to:

- View the total number of participants.
- View the number of participants in each group.
- View task-wise decision distributions.
- Compare experimental and control group responses.
- View average decision times.
- View selection changes.
- Export collected data as CSV.

Keep participant-facing screens separate from the researcher dashboard.

## 13. Technical Requirements

Build the application using a suitable web technology stack.

Preferred stack:
- Frontend: React with HTML, CSS, and JavaScript.
- Backend: Python Flask or Node.js.
- Database: SQLite for a simple local experiment, or PostgreSQL for a deployed experiment.

Use clean, modular, maintainable code.

Implement proper state management, reliable timer functionality, session persistence, input validation, and error handling.

The application should be runnable locally and should include clear setup instructions.

## 14. Expected Deliverable

Deliver a fully functional experimental web application, not just static mockup screens.

The application must allow a participant to:
1. Enter the experiment.
2. Be assigned to an experimental condition.
3. Complete all three decision tasks.
4. Experience the appropriate confirmation mechanism.
5. Complete the final questionnaire.
6. Submit their responses.

The researcher must be able to retrieve and analyse the collected experimental data.

Prioritise experimental validity, reliable event logging, and consistency between the experimental and control conditions over unnecessary visual complexity.
## 15. Configurable Pause Duration (Researcher-Controlled)

The application must support dynamically changing the confirmation pause duration through the administrator dashboard.

### Admin Configuration

Add an experimental settings section to the researcher dashboard with the following controls:

- Pause duration (in seconds).
- Enable/disable the pause mechanism.
- Apply the configured duration to all three decision tasks.
- Option to configure different pause durations for individual tasks.
- Save and update experimental settings.

Allow the researcher to select common durations such as:
- 0 seconds (no pause).
- 5 seconds.
- 10 seconds.
- 15 seconds.
- 20 seconds.
- 30 seconds.
- Custom duration (entered manually).

### Experimental Behaviour

The application should dynamically use the configured pause duration.

For example:
- If the pause is set to 5 seconds, the confirmation button activates after 5 seconds.
- If the pause is set to 10 seconds, the confirmation button activates after 10 seconds.
- If the pause is set to 20 seconds, the confirmation button activates after 20 seconds.
- If the pause is set to 0 seconds, confirmation is immediately available.

The countdown must automatically adjust to the configured duration without requiring code modifications.

### Group Configuration

Allow the researcher to configure the experimental conditions:

- **Control Group:** Immediate confirmation (0-second delay).
- **Experimental Group:** Researcher-defined pause duration.

The researcher should be able to change the experimental pause duration without changing the control group's behaviour.

### Experimental Data Logging

For every participant and decision task, record:

- Configured pause duration.
- Actual countdown duration.
- Whether the countdown was completed.
- Time at which the countdown started.
- Time at which the confirmation button became active.
- Actual decision time, excluding the imposed pause.

Store the pause configuration alongside the participant's responses so that results from different experimental settings can be compared.

### Important Implementation Requirements

- Never hardcode the pause duration to 10 seconds.
- Retrieve the current configuration from the backend.
- Apply settings consistently to new participants.
- Do not change the pause duration midway through an active participant's experiment.
- Save a snapshot of the experimental configuration when a participant starts.
- Ensure that changing settings affects future participants and not participants already completing the experiment.
- The administrator must be able to see which pause duration was used for each participant.
## Data Collection and Final Experiment Report

The application does not require a backend, database, server-side storage, or administrator dashboard.

All participant data should be collected and maintained locally within the browser during the experiment using JavaScript state and, where necessary, sessionStorage or localStorage.

### 1. Data Collection

For each of the three decision-making tasks, collect:

- Assigned experimental condition.
- Configured pause duration.
- Selected option.
- Initial selection and final selection.
- Whether the participant changed their selection.
- Time taken to make the initial selection.
- Time taken to confirm the final decision.
- Total time spent on the task.
- Whether the participant completed the countdown.

Also collect the participant's responses to the final questionnaire.

### 2. Final Results and Report Page

After completing all three tasks and the questionnaire, display a comprehensive final report.

The report should be presented as a clean, well-structured dashboard-style summary.

Include the following sections:

**A. Experiment Overview**
- Participant ID (automatically generated anonymous ID).
- Assigned experimental condition.
- Configured pause duration.
- Number of completed tasks.
- Total experiment completion time.

**B. Decision Summary**

Display a table summarising all three tasks:

| Task | Selected Option | Initial Decision | Changed Decision? | Decision Time |
|---|---|---|---|---|
| Consumer Price/Value | Selected product | Initial choice | Yes/No | Time |
| App Privacy | Selected permission option | Initial choice | Yes/No | Time |
| Subscription | Selected subscription option | Initial choice | Yes/No | Time |

**C. Task-wise Analysis**

For each task, display:
- Participant's final choice.
- Important information associated with the choice.
- Relevant implications of the selected option.
- Time taken to make the decision.
- Whether the participant changed their initial selection.

Provide a short, neutral interpretation of each decision without claiming that a particular choice is objectively correct.

**D. Behavioural Summary**

Show:
- Total decision-making time across all tasks.
- Average decision-making time.
- Number of decisions changed.
- Number of countdowns completed.
- Whether the participant selected options involving additional privacy permissions.
- Whether the participant accepted an auto-renewing subscription.

**E. Questionnaire Results**

Display all final questionnaire responses in a readable format, including Likert-scale answers and optional feedback.

**F. Final Participant Summary**

Generate a short, neutral summary of the participant's decision-making behaviour across the three scenarios.

For example:
- Whether the participant changed any decisions.
- Whether the participant selected options with additional costs or obligations.
- Whether the participant accepted additional privacy permissions.
- Whether the participant accepted recurring subscription payments.

Avoid presenting these observations as psychological diagnoses or definitive conclusions.

### 3. Report Export

Provide the following options on the final page:

- Download Report as PDF.
- Download Raw Experiment Data as CSV.
- Restart Experiment.

The PDF should contain the complete participant summary, task-wise decisions, timing information, and questionnaire responses.

The CSV should contain the raw collected data in a structured format for subsequent analysis.

### 4. Technical Requirements

- No backend or database.
- No external data transmission.
- Maintain participant data in browser memory or local browser storage.
- Generate the final report dynamically from collected responses.
- Generate PDF and CSV files directly in the browser.
- Ensure the report remains available until the participant restarts the experiment or clears the session.
- When restarting, clear the previous participant's data and generate a new anonymous participant ID.
- Preserve the experimental condition and pause configuration throughout an active experiment.

The final report must be generated entirely on the final page using the data collected during that participant's session.

The application should support future experiments comparing multiple pause durations, such as 0, 5, 10, 15, and 20 seconds, without requiring changes to the application code.