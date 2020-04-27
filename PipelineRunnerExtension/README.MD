# Configurable Pipeline Runner

The purpose of this Build task is to provide a solution for :

- Triggering Remote/Delegate/Child Pipelines any amount of times from a Parent pipeline.
- The build task allows passing variables that are passed to the delegate pipeline at runtime.
- The variable array in Json Array format will determine how many delegate pipeline instances are started (Restricted to the Pipeline Agents Available)
- Monitor the execution of the remotely triggered delegate pipelines by polling execution status on a configurable interval before completing.
- Downloads any Artifacts Produced by the remotely triggered delegate pipelines and publishes it to the Parent Pipeline.
- Creates a summary page with links to the pipeline execution results for easy reference.

## Getting Started

The Build Task requires the configuration of an Azure DevOps service connection. The respective service connection will need personal access token with multiple organization access. You can read more about creating your [Personal Access Token](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=vsts) here,

Why is a PAT required to configure the task ?
Answer: The PAT is used at design time to query the Azure DevOps REST APIs for the configure Service Connection in order to return filtered lists containing relevant Projects,Folders (in which build definitions are nested) and the Build Definitions.

At runtime the Build Task uses the Azure Pipelines CLI to trigger and monitor pipelines and uses the SystemAccessToken for authentication.

1. Create a Service Connection

    ![Create/Configure Service Connection](https://raw.githubusercontent.com/microsoft/CSEDevOps/master/PipelineRunnerExtension/images/screenshot-2.png)

2. Configure Build Task Properties/Fields

    Configure the task with the required properties to trigger your builds. The Pipeline task can be added to you Parent Pipeline multiple times but will require that you set a unique CustomPrefix per instance in order to correctly separate build artifacts and summary reports as depicted in the following numbered list.

    ![Configure Pipeline Properties](https://raw.githubusercontent.com/microsoft/CSEDevOps/master/PipelineRunnerExtension/images/screenshot-1.png)

3. Review Pipeline Summary Report

    For each instance of the Build Task that is configured a Summary Report will be displayed using the CustomPrefix provided during the task configuration. It will list the builds that it executed as well as it's final status, either **Succeeded/Failed** with a clickable link to the build results page for easy referencing.

    ![Review Report](https://raw.githubusercontent.com/microsoft/CSEDevOps/master/PipelineRunnerExtension/images/screenshot-3.png)

4. Review Artifacts

    If the triggered builds produce artifacts and you have configured the task to download artifacts the artifacts will be consolidated in a single published artifact, organized by BuildID of the delegate builds. If the task is added to your Parent Pipeline multiple times, the artifacts will be published using the unique CustomPrefix that you have configured per instance as a grouping mechanism.

    ![Review Artifacts](https://raw.githubusercontent.com/microsoft/CSEDevOps/master/PipelineRunnerExtension/images/screenshot-4.png)

## Task Fields

This section describes the fields that can be configured on the Build Task

Inputs:

- **Service Connection**: Pick List which lists service connections created as in **step 1** above
- **Project**: Project in which the Build Definitions can be found
- **Folder Path**: Folder location where Build Definitions are stored as an organizational unit
- **Build Definition**: The Name of the Build that you wish to trigger
- **Set Branch**: Boolean property which enables a field that allows you to pick define a branch against which the triggered pipeline must run. If not selected the pipeline will be run against the master branch
- **Branch**: Set the branch that the triggered pipeline must target. If left blank defaults to master
- **Parameter Source**: 'inline'/ 'filepath' allows build parameters to be passed from a file or inline
- **Build Variables**: Sample Json Array '[{"Var1":"hello","Var2":"world" },{"Var1":"Bye","Var2":"world" }]' in the preceding example the delegate pipeline will be executed twice one for each **element {}** and in each case the variables **Var1** and **Var2** will be passed to the Pipeline being executed as variables
- **Custom Prefix**: Must be set to a unique string value if the Build Task is added to Parent Pipeline more than once
- **Wait Till Triggered Builds Finish**: Boolean value to determine weather a fan-out and fan in pattern is observed. If left unchecked delegate pipelines will be Triggered, but the parent pipeline will not wait for completion and will not collect artifacts or report status of the resultant builds.
- **Build Completion Polling Interval**: The sleep time between status checks set in seconds
- **Build Timeout in minutes**: Time to wait before abandoning polling of queued builds.
- **Download Build Artifacts**: Boolean field to opt into downloading build Artifacts
- **Artifact Drop Directory**: Defaults to '$(Build.ArtifactStagingDirectory)' and is the directory where build artifacts will be stored temporarily
- **Store Triggered Build Ids In A Variable**: boolean value to determine whether an environment variable with the following naming convention ${CUSTOMPREFIX}_BUILD_IDS or TRIGGERED_BUILD_IDS where a CustomPrefix has not been provided and there is only a single instance of the build task in the Parent pipeline.
