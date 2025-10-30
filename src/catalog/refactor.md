Focusing in the catalog module lets refactor following the next steps:

Structure: 
/domain = contains entity, services and value objects. No subfolders. Move usecases to service. 
/interface = contains dtos and controller. dtos subfolder. Controller in the root.
catalog.module.ts 

Dont create value objects for all the item properties. 

Lets keep it simple, MVP level. 

The goal is to have working routes without the DynamoDB implementation.