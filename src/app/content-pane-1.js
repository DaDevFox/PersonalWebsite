import Section_TextLeft from "./Section_TextLeft";
import Row_ImageLeft from "./Row_ImageLeft";
import Row_ImageRight from "./Row_ImageRight";

import logo_gh from "./GitHub_Invertocat_Dark.svg";
import space_race from "./SpaceRaceName_BlackBG.png";
import logo_cs from "./Csharp_Logo.png";
import logo_unity from "./U_Logo_Black_RGB.png";

export default function ContentOne(props) {
  return (
    <div className="boids_blocker">
      <div className="content_container">
        <Row_ImageLeft
          image_size={100}
          image_src={logo_gh}
          image_link={"https://github.com/DaDevFox/SpaceRace"}
          title="Space Race"
          description="Rocket-racing simulation game to help Calculus AB students prepare for the AP Calculus Exam. "
          image_2
          image_2_width={50}
          image_2_height={50}
          image_2_src={logo_cs}
          image_3
          image_3_padding={10}
          image_3_width={110}
          image_3_height={50}
          image_3_src={logo_unity}
        >
          <Section_TextLeft title="Projects" />
        </Row_ImageLeft>
        {/* <Row_ImageRight
        iamge_size={100}
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
    </div>
  );
}
