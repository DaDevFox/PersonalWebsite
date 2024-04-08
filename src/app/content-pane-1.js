import Section_TextLeft from "./Section_TextLeft";
import Row_ImageLeft from "./Row_ImageLeft";
import Row_ImageRight from "./Row_ImageRight";

import logo_gh from "./GitHub_Invertocat_Dark.svg";
import space_race from "./SpaceRaceName_BlackBG.png";
import asteroids from "./Asteroids.png";
import logo_cs from "./Csharp_Logo.png";
import logo_unity from "./U_Logo_Black_RGB.png";
import logo_cpp from "./cpp_logo.png";
import logo_sdl from "./SDL_logo.png";

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
        {
          <Row_ImageRight
            image_size={100}
            image_src={asteroids}
            image_link="https://github.com/DaDevFox/AsteroidsSDL2/releases/tag/v0.2"
            title="Asteroids"
            description="2D stealth-strategy game about a sentient asteroid hiding in an asteroid field from enemy ships. "
            image_2
            image_2_width={50}
            image_2_height={50}
            image_2_src={logo_cpp}
            image_3
            image_3_padding={10}
            image_3_width={80}
            image_3_height={50}
            image_3_src={logo_sdl}
          ></Row_ImageRight>
        }
      </div>
    </div>
  );
}
