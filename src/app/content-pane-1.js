import boid_styles from "../components/boids.module.css";

import Section_TextLeft from "../components/Section_TextLeft";
import Row_ImageLeft from "../components/Row_ImageLeft";
import Row_ImageRight from "../components/Row_ImageRight";

import logo_gh from "@/media/GitHub_Invertocat_Dark.svg";
import space_race from "@/media/SpaceRaceName_BlackBG.png";
import asteroids from "@/media/Asteroids.png";
import logo_cs from "@/media/Csharp_Logo.png";
import logo_unity from "@/media/U_Logo_Black_RGB.png";
import logo_cpp from "@/media/cpp_logo.png";
import logo_sdl from "@/media/SDL_logo.png";

export default function ContentOne(props) {
  return (
    <div className={boid_styles.boids_blocker}>
      <div className="content_container">
        <Row_ImageRight
          image_size={100}
          image_src={asteroids}
          image_link="https://github.com/DaDevFox/AsteroidsSDL2/releases"
          title="Asteroids"
          description="2D stealth-strategy game about a sentient asteroid hiding from enemy ships in an asteroid field. "
          image_2
          image_2_width={50}
          image_2_height={50}
          image_2_src={logo_cpp}
          image_3
          image_3_padding={10}
          image_3_width={80}
          image_3_height={50}
          image_3_src={logo_sdl}
        >
          <Section_TextLeft title="Games" />
        </Row_ImageRight>
        <Row_ImageLeft
          image_size={100}
          image_src={logo_gh}
          image_link={"https://github.com/DaDevFox/SpaceRace/releases"}
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
        ></Row_ImageLeft>
        <Row_ImageRight
          image_size={100}
          image_src={logo_gh}
          image_link="https://github.com/DaDevFox/TriviaGame/releases"
          title="Trivia Game"
          description="Configurable trivia game featuring persistent profiles, stats, and varied round formats using the OpenTriviaQA question repository."
          image_2
          image_2_width={50}
          image_2_height={50}
          image_2_src={logo_cs}
          image_3
          image_3_padding={10}
          image_3_width={110}
          image_3_height={50}
          image_3_src={logo_unity}
        ></Row_ImageRight>
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
  );
}
