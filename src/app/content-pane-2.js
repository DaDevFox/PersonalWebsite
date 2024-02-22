import Section_TextLeft from "./Section_TextLeft";
import Row_ImageLeft from "./Row_ImageLeft";
import Row_ImageRight from "./Row_ImageRight";

import logo_gh from "./GitHub_Invertocat_Dark.svg";

export default function ContentTwo(props) {
  return (
    <div className={"boids_blocker"}>
      <div className={"content_container"}>
        <div className="full_row" style={{ alignItems: "center " }}>
          <Section_TextLeft title="Contact" />
          <div>
            <p style={{ padding: 10 }}>
              <strong>Get in touch</strong>:{" "}
              <a href="mailto:mehul.tahiliani@gmail.com">
                mehul.tahiliani@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
      {/* <Row_ImageLeft
        image_size={100}
        image_alt="GitHub Logo"
        image_src={logo_gh}
        title="proj title"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum."
      /> */}
    </div>
  );
}
