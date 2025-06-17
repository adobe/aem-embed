# AEM Embed
This repository is the home of a componentized approach that allows to embed content from AEM into other 3rd party experiences.
The goal is to create it simple and easy way to embed content in applications that are built in any Javascript framework and/or native applications.
Relying on web-components technology allows integration in a lot of web based technologies.

Find more documentation here: https://www.aem.live/docs/aem-embed

## Use cases
### Header / Footer
When migrating large websites there are often multiple systems serving pages. In those cases it is still great ot have shared components across various different platforms. 
Very often the first shared component are headers (navigation etc.) and footers. This approach allows a centralized management of content and 
layout while being able to easily integrate headers and footers across a wide range of delivery technologies. 

### Banners / Promotions / Placements
There cases where there is a set of slots / placements for content inside an existing application or website.
Allowing to externalize both the content and the layout from the existing application or website, makes it easy to connect an existing app to manage content
and layout in a centralized fashion. In this use case it is particularly important to isolate layout from the layout to not interfere with the containing application / website.
