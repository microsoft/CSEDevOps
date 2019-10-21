# OWASP/ZAP Scanning extension for Azure DevOps

![Build Status](https://csedevops.visualstudio.com/DevSecOps/_apis/build/status/owasp-zap-azure-extension)

[OWASP/ZAP](https://www.owasp.org/index.php/OWASP_Zed_Attack_Proxy_Project) is a popular free security tool for helping to identify vulnerabilities during the development process from [OWASP](https://www.owasp.org). This extension shifts scanning and reporting into the Azure DevOps Pipeline model to enable quick feedback and response from development teams throughout the development life-cycle.

![azure task](https://raw.githubusercontent.com/microsoft/CSEDevOps/master/Zap/docs/images/zap-scanner-task.png)

## Usage

### Prerequisite

This task simplifies shifting security scanning of web applications into the DevOps pipeline in part by removing the requirement of having a running, exposed ZAP proxy before attempting the scan. By installing the proxy, you are enabling self-contained scans within your CI/CD pipeline. The core requirement for usage is a Docker install available to this task.

### Configuration

After installing the scanner from the Azure DevOps Marketplace, you will need to add the scanner to your agent job and configure a few basic requirements.

![zap scanner task config](https://raw.githubusercontent.com/microsoft/CSEDevOps/master/Zap/docs/images/zap-scanner-config.png)

- The "Display name" of the task can be left as-is, or it can be updated to fit withing the naming conventions of your pipeline better.

- By default, the task will run a baseline scan.

#### Baseline Scan Notes

> The baseline scan will spider the target for 1 minute and then wait for the passive scanning to complete. This makes for a relatively short-running scan that doesn't perform any attacks.

#### Full Scan Notes

> A full-scan can be run by ticking the "Aggressive Scan Mode" checkbox. This scan doesn't have a time limit and does perform 'attacks.' It can run for a long time. Not ideally suited for CI, but is a useful tool for release-gates. ![aggressive-scan](https://raw.githubusercontent.com/microsoft/CSEDevOps/master/Zap/docs/images/zap-aggressive.png)

- The "Failure Threshold" indicates the score for which the pipeline will begin to fail. The scoring mechanism built into this scanner is meant to be suggestive, and security personnel knowledgable about threat-models for the specific application should be engaged to adjust this value appropriately. The default of 50 is not meant to be suggestive as correct. The threshold is a simple aggregation of risk codes, confidences, and counts of vulnerabilities discovered by the scan.

- By default, that "Scan Type" used is "Scan on Agent." This type of scan is beneficial in pipelines for containerized applications. **This usage requires a preceding step to build your image and run it (detached) within the agent.**

- When running a full-scan in release-pipelines, or if your application is not containerized and has to run in a VM, "Scan Type" can be changed to "Targeted Scan." In this case, you are required to provide the schema and address for your target. Ex. <https://10.20.10.40> or <http://myWebSite.net>.

> - By default, the scan will be performed without much effort at scoping for tech, excluded URL endpoints, etc.., but you can provide a context file for a more focused scan. The context file is useful to take full advantage of the baseline scans minute of crawling or, to narrow the scope of a full-scan in aggressive mode to keep the duration as short as possible. To accomplish this, check the "Provide Context File" box and provide the path to a context file in your source repository relative to the build copy of the source. ![context provided](https://raw.githubusercontent.com/microsoft/CSEDevOps/master/Zap/docs/images/zap-context-provided.png)

- Finally, provide an optional port number for custom ports. By default, the scan will be interested in port 80 on the target system.

### Reporting

#### Install handlebars

Take advantage of handlebars templating for a simple reporting dashboard/tab and generate the template to report from.

```YAML
- bash: |
   sudo npm install -g handlebars-cmd

   cat <<EOF > owaspzap/nunit-template.hbs
   {{#each site}}

   <test-run
       id="2"
       name="Owasp test"
       start-time="{{../[@generated]}}"  >
       <test-suite
           id="{{@index}}"
           type="Assembly"
           name="{{[@name]}}"
           result="Failed"
           failed="{{alerts.length}}">
           <attachments>
               <attachment>
                   <filePath>owaspzap/report.html</filePath>
               </attachment>
           </attachments>
       {{#each alerts}}<test-case
           id="{{@index}}"
           name="{{alert}}"
           result="Failed"
           fullname="{{alert}}"
           time="1">
               <failure>
                   <message>
                       <![CDATA[{{{desc}}}]]>
                   </message>
                   <stack-trace>
                       <![CDATA[
   Solution:
   {{{solution}}}

   Reference:
   {{{reference}}}

   instances:{{#each instances}}
   * {{uri}}
       - {{method}}
       {{#if evidence}}- {{{evidence}}}{{/if}}
                       {{/each}}]]>
                   </stack-trace>
               </failure>
       </test-case>
       {{/each}}
       </test-suite>
   </test-run>
   {{/each}}
   EOF
  displayName: 'owasp nunit template'
  condition: always()
```

#### Report Generation

Use the handlebars template and json report from the ZAP scan to generate an xml report in the nunit style to display.

```YAML
- bash: ' handlebars owaspzap/report.json < owaspzap/nunit-template.hbs > owaspzap/test-results.xml'
  displayName: 'generate nunit type file'
  condition: always()
```

#### Publish Report (Nunit Style)

```YAML
- task: PublishTestResults@2
  displayName: 'Publish Test Results **/TEST-*.xml'
  inputs:
    testResultsFormat: NUnit
    testResultsFiles: 'owaspzap/test-results.xml'
  condition: always()
```

You should now have 'test' tab on the pipeline build that displays useful infomration about vulnerabilities revealed during the scan. The vulnerability test results are not reliant on the pass/fail outcome of the build. This means that even with a scan that is acceptable by the threshold you could have some areas of concern to explore in the repot.

![full report view](https://raw.githubusercontent.com/microsoft/CSEDevOps/master/Zap/docs/images/scan-results-collapsed.png)

The list of failures (currently under "NUnit Test Run) are expandable links. Clicking on each will open details to the right which can guide the team to fixing the issues found.

![vulnerability drill-down](https://raw.githubusercontent.com/microsoft/CSEDevOps/master/Zap/docs/images/scan-results-drill-down.png)
